
CREATE OR REPLACE FUNCTION sp_close_pos_session(
  p_user_id UUID,
  p_session_id BIGINT,
  p_closing_amount DECIMAL(12,2),
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_session RECORD;
  v_expected_amount DECIMAL(12, 2);
  v_difference DECIMAL(12, 2);
  v_open_status_id INTEGER;
  v_close_status_id INTEGER;
  v_business_account_total DECIMAL(12, 2);
BEGIN
  -- Get open status id
  SELECT st.id INTO v_open_status_id
  FROM statuses st
  JOIN modules mo ON st.module_id = mo.id AND mo.code = 'POS'
  WHERE st.code = 'OPE';

  -- Get close status id
  SELECT st.id INTO v_close_status_id
  FROM statuses st
  JOIN modules mo ON st.module_id = mo.id AND mo.code = 'POS'
  WHERE st.code = 'CLO';

  -- Get session and verify ownership
  SELECT * INTO v_session
  FROM pos_sessions
  WHERE id = p_session_id
    AND user_id = p_user_id
    AND status_id = v_open_status_id;

  IF v_session IS NULL THEN
    RAISE EXCEPTION 'Cash session not found or not owned by user';
  END IF;

  -- Get current total_amount of the linked business account
  SELECT total_amount INTO v_business_account_total
  FROM business_accounts
  WHERE id = v_session.business_account;

  -- expected_amount = opening_amount + total_cash_sales + other_external_movements
  -- which equals the current business account total_amount
  v_expected_amount := v_business_account_total;

  -- Calculate difference: what was physically counted vs what is expected
  v_difference := p_closing_amount - v_expected_amount;

  -- Update session
  UPDATE pos_sessions
  SET
    "closing_amount number" = p_closing_amount,
    expected_amount = v_expected_amount,
    difference = v_difference,
    total_sales = v_session.total_cash_sales,
    status_id = v_close_status_id,
    closed_at = NOW(),
    notes = COALESCE(p_notes, notes)
  WHERE id = p_session_id;

  -- Return session data
  RETURN json_build_object(
    'session_id', p_session_id,
    'opening_amount', v_session.opening_amount,
    'closing_amount', p_closing_amount,
    'expected_amount', v_expected_amount,
    'total_cash_sales', v_session.total_cash_sales,
    'difference', v_difference,
    'closed_at', NOW()
  );
END;
$$;
