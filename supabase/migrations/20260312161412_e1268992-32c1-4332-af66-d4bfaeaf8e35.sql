CREATE OR REPLACE FUNCTION sp_create_user_profile(
  p_uid uuid,
  p_name character varying,
  p_middle_name character varying DEFAULT NULL,
  p_last_name character varying DEFAULT NULL,
  p_last_name2 character varying DEFAULT NULL,
  p_document_type_id bigint DEFAULT NULL,
  p_document_number character varying DEFAULT NULL,
  p_show boolean DEFAULT true,
  p_country_id bigint DEFAULT NULL,
  p_state_id bigint DEFAULT NULL,
  p_city_id bigint DEFAULT NULL,
  p_neighborhood_id bigint DEFAULT NULL,
  p_address text DEFAULT NULL,
  p_address_reference text DEFAULT NULL,
  p_warehouse_id bigint DEFAULT NULL,
  p_branch_id bigint DEFAULT NULL,
  p_type_ids bigint[] DEFAULT '{}',
  p_role_ids bigint[] DEFAULT '{}',
  p_user_name character varying DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_account_id BIGINT;
  v_existing_account_id BIGINT;
  v_is_new_account BOOLEAN := FALSE;
BEGIN
  -- Check if account with same document type and number already exists
  SELECT id INTO v_existing_account_id FROM accounts
  WHERE document_number = p_document_number
    AND document_type_id = p_document_type_id;

  IF FOUND THEN
    v_account_id := v_existing_account_id;
  ELSE
    INSERT INTO accounts (name, middle_name, last_name, last_name2,
      document_type_id, document_number, is_active, show)
    VALUES (p_name, p_middle_name, p_last_name, p_last_name2,
      p_document_type_id, p_document_number, TRUE, p_show)
    RETURNING id INTO v_account_id;
    v_is_new_account := TRUE;
  END IF;

  IF EXISTS (SELECT 1 FROM profiles WHERE "UID" = p_uid) THEN
    RAISE EXCEPTION 'A profile already exists for this auth user';
  END IF;

  INSERT INTO profiles ("UID", account_id, country_id, state_id,
    city_id, neighborhood_id, address, address_reference,
    warehouse_id, branch_id, is_active, user_name)
  VALUES (p_uid, v_account_id, p_country_id, p_state_id,
    p_city_id, p_neighborhood_id, p_address, p_address_reference,
    p_warehouse_id, p_branch_id, TRUE, p_user_name);

  IF array_length(p_type_ids, 1) > 0 THEN
    INSERT INTO account_types (account_id, account_type_id)
    SELECT v_account_id, t_id
    FROM UNNEST(p_type_ids) AS t_id
    WHERE NOT EXISTS (
      SELECT 1 FROM account_types at2
      WHERE at2.account_id = v_account_id AND at2.account_type_id = t_id
    );
  END IF;

  IF array_length(p_role_ids, 1) > 0 THEN
    INSERT INTO user_roles (user_id, role_id)
    SELECT p_uid, r_id
    FROM UNNEST(p_role_ids) AS r_id
    WHERE NOT EXISTS (
      SELECT 1 FROM user_roles ur2
      WHERE ur2.user_id = p_uid AND ur2.role_id = r_id
    );
  END IF;

  RETURN json_build_object(
    'success', true,
    'account_id', v_account_id,
    'auth_uid', p_uid,
    'is_new_account', v_is_new_account
  );
END;
$$;