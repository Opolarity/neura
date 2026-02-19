DROP FUNCTION IF EXISTS public.sp_open_pos_session(uuid,integer,integer,numeric,integer,text);

CREATE OR REPLACE FUNCTION public.sp_open_pos_session(
  p_user_id UUID,
  p_warehouse_id INTEGER,
  p_branch_id INTEGER,
  p_opening_amount NUMERIC,
  p_business_account_id INTEGER,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_existing_session_id INTEGER;
  v_new_session_id INTEGER;
  v_open_status_id INTEGER;
  v_expected_amount NUMERIC;
  v_opening_difference NUMERIC;
BEGIN
  SELECT st.id INTO v_open_status_id
  FROM statuses st
  JOIN modules mo ON st.module_id = mo.id AND mo.code = 'POS'
  WHERE st.code = 'OPE';

  IF v_open_status_id IS NULL THEN
    RAISE EXCEPTION 'Open status not found for POS module';
  END IF;

  SELECT id INTO v_existing_session_id
  FROM pos_sessions
  WHERE user_id = p_user_id
    AND status_id = v_open_status_id;

  IF v_existing_session_id IS NOT NULL THEN
    RAISE EXCEPTION 'User already has an open cash session (ID: %)', v_existing_session_id;
  END IF;

  IF p_business_account_id IS NULL THEN
    RAISE EXCEPTION 'business_account_id is required';
  END IF;

  -- Get expected amount from business account
  SELECT total_amount INTO v_expected_amount
  FROM business_accounts
  WHERE id = p_business_account_id;

  IF v_expected_amount IS NULL THEN
    v_expected_amount := 0;
  END IF;

  v_opening_difference := p_opening_amount - v_expected_amount;

  INSERT INTO public.pos_sessions (
    user_id, warehouse_id, branch_id, opening_amount,
    business_account, status_id, notes, opened_at, opening_difference
  )
  VALUES (
    p_user_id, p_warehouse_id, p_branch_id, p_opening_amount,
    p_business_account_id, v_open_status_id, p_notes, NOW(), v_opening_difference
  )
  RETURNING id INTO v_new_session_id;

  RETURN json_build_object(
    'session_id', v_new_session_id,
    'user_id', p_user_id,
    'warehouse_id', p_warehouse_id,
    'branch_id', p_branch_id,
    'opening_amount', p_opening_amount,
    'expected_amount', v_expected_amount,
    'opening_difference', v_opening_difference,
    'business_account', p_business_account_id,
    'status_id', v_open_status_id,
    'opened_at', NOW()
  );
END;
$$;