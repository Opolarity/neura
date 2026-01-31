CREATE OR REPLACE FUNCTION sp_close_pos_session(
  p_user_id UUID,
  p_session_id BIGINT,
  p_closing_amount DECIMAL(12, 2),
  p_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session RECORD;
  v_expected_amount DECIMAL(12, 2);
  v_sales_total DECIMAL(12, 2);
  v_difference DECIMAL(12, 2);
  v_open_status_id INTEGER;
  v_close_status_id INTEGER;
BEGIN
  -- Get open status id (fixed: qualify column with table alias)
  SELECT st.id INTO v_open_status_id
  FROM statuses st
  JOIN modules mo ON st.module_id = mo.id AND mo.code = 'POS'
  WHERE st.code = 'OPE';

  -- Get close status id (fixed: qualify column with table alias)
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

  -- Calculate expected amount: opening + sum of cash payments in this session
  SELECT COALESCE(SUM(op.amount), 0)
  INTO v_sales_total
  FROM order_payment op
  JOIN pos_session_orders pso ON pso.order_id = op.order_id
  WHERE pso.pos_session_id = p_session_id;

  v_expected_amount := v_session.opening_amount + v_sales_total;

  -- Calculate difference
  v_difference := p_closing_amount - v_expected_amount;

  -- Update session
  UPDATE pos_sessions
  SET
    "closing_amount number" = p_closing_amount,
    expected_amount = v_expected_amount,
    difference = v_difference,
    total_sales = v_sales_total,
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
    'sales_total', v_sales_total,
    'difference', v_difference,
    'closed_at', NOW()
  );
END;
$$;