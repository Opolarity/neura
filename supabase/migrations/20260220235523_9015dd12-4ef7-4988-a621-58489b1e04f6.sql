
-- 1. Clean orphaned accounts (IDs 51, 52, 53)
DELETE FROM account_types WHERE account_id IN (51, 52, 53);
DELETE FROM profiles WHERE account_id IN (51, 52, 53);
DELETE FROM accounts WHERE id IN (51, 52, 53) 
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE profiles.account_id = accounts.id);

-- 2. Create stored procedure for atomic user profile creation
CREATE OR REPLACE FUNCTION public.sp_create_user_profile(
  p_uid UUID,
  p_name VARCHAR,
  p_middle_name VARCHAR DEFAULT NULL,
  p_last_name VARCHAR DEFAULT NULL,
  p_last_name2 VARCHAR DEFAULT NULL,
  p_document_type_id BIGINT DEFAULT NULL,
  p_document_number VARCHAR DEFAULT NULL,
  p_show BOOLEAN DEFAULT TRUE,
  p_country_id BIGINT DEFAULT NULL,
  p_state_id BIGINT DEFAULT NULL,
  p_city_id BIGINT DEFAULT NULL,
  p_neighborhood_id BIGINT DEFAULT NULL,
  p_address TEXT DEFAULT NULL,
  p_address_reference TEXT DEFAULT NULL,
  p_warehouse_id BIGINT DEFAULT NULL,
  p_branch_id BIGINT DEFAULT NULL,
  p_type_ids BIGINT[] DEFAULT '{}',
  p_role_ids BIGINT[] DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id BIGINT;
  v_existing RECORD;
BEGIN
  -- Check duplicates
  SELECT id INTO v_existing FROM accounts
  WHERE document_number = p_document_number
    AND document_type_id = p_document_type_id;

  IF FOUND THEN
    RAISE EXCEPTION 'User already exists with this document';
  END IF;

  -- Insert account
  INSERT INTO accounts (name, middle_name, last_name, last_name2,
    document_type_id, document_number, is_active, show)
  VALUES (p_name, p_middle_name, p_last_name, p_last_name2,
    p_document_type_id, p_document_number, TRUE, p_show)
  RETURNING id INTO v_account_id;

  -- Insert profile
  INSERT INTO profiles ("UID", account_id, country_id, state_id,
    city_id, neighborhood_id, address, address_reference,
    warehouse_id, branch_id, is_active)
  VALUES (p_uid, v_account_id, p_country_id, p_state_id,
    p_city_id, p_neighborhood_id, p_address, p_address_reference,
    p_warehouse_id, p_branch_id, TRUE);

  -- Insert account types
  IF array_length(p_type_ids, 1) > 0 THEN
    INSERT INTO account_types (account_id, account_type_id)
    SELECT v_account_id, UNNEST(p_type_ids);
  END IF;

  -- Insert user roles
  IF array_length(p_role_ids, 1) > 0 THEN
    INSERT INTO user_roles (user_id, role_id)
    SELECT p_uid, UNNEST(p_role_ids);
  END IF;

  RETURN json_build_object(
    'success', true,
    'account_id', v_account_id,
    'auth_uid', p_uid
  );
END;
$$;
