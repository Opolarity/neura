-- Update sp_open_pos_session to accept business_account_id
CREATE OR REPLACE FUNCTION sp_open_pos_session(
  p_user_id UUID,
  p_warehouse_id INTEGER,
  p_branch_id INTEGER,
  p_opening_amount NUMERIC DEFAULT 0,
  p_business_account_id INTEGER DEFAULT NULL,
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_existing_session_id INTEGER;
  v_new_session_id INTEGER;
  v_open_status_id INTEGER;
BEGIN
  -- Get open status id from statuses table
  SELECT st.id INTO v_open_status_id
  FROM statuses st
  JOIN modules mo ON st.module_id = mo.id AND mo.code = 'POS'
  WHERE st.code = 'OPE';

  IF v_open_status_id IS NULL THEN
    RAISE EXCEPTION 'Open status not found for POS module';
  END IF;

  -- Check if user already has an open session
  SELECT id INTO v_existing_session_id
  FROM pos_sessions
  WHERE user_id = p_user_id
    AND status_id = v_open_status_id;

  IF v_existing_session_id IS NOT NULL THEN
    RAISE EXCEPTION 'User already has an open cash session (ID: %)', v_existing_session_id;
  END IF;

  -- Validate business_account_id
  IF p_business_account_id IS NULL THEN
    RAISE EXCEPTION 'business_account_id is required';
  END IF;

  -- Create new session including business_account
  INSERT INTO public.pos_sessions (
    user_id,
    warehouse_id,
    branch_id,
    opening_amount,
    business_account,
    status_id,
    notes,
    opened_at
  )
  VALUES (
    p_user_id,
    p_warehouse_id,
    p_branch_id,
    p_opening_amount,
    p_business_account_id,
    v_open_status_id,
    p_notes,
    NOW()
  )
  RETURNING id INTO v_new_session_id;

  RETURN json_build_object(
    'session_id', v_new_session_id,
    'user_id', p_user_id,
    'warehouse_id', p_warehouse_id,
    'branch_id', p_branch_id,
    'opening_amount', p_opening_amount,
    'business_account', p_business_account_id,
    'status_id', v_open_status_id,
    'opened_at', NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;