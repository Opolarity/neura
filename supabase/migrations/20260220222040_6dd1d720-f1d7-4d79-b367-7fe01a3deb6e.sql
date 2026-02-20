
CREATE OR REPLACE FUNCTION public.fn_update_pos_session_cash_on_order()
RETURNS TRIGGER AS $$
DECLARE
  v_cash_total numeric := 0;
  v_business_account_id bigint;
BEGIN
  -- Sum payments for this order where payment method code is 'CASH'
  SELECT COALESCE(SUM(op.amount), 0)
  INTO v_cash_total
  FROM order_payment op
  JOIN payment_methods pm ON pm.id = op.payment_method_id
  WHERE op.order_id = NEW.order_id
    AND pm.code = 'CASH';

  -- Only proceed if there's cash
  IF v_cash_total > 0 THEN
    -- Get the business_account linked to this POS session
    SELECT ps.business_account
    INTO v_business_account_id
    FROM pos_sessions ps
    WHERE ps.id = NEW.pos_session_id;

    -- Update total_cash_sales on the session (no longer touches expected_amount)
    UPDATE pos_sessions
    SET total_cash_sales = COALESCE(total_cash_sales, 0) + v_cash_total
    WHERE id = NEW.pos_session_id;

    -- Update total_amount on the linked business account
    UPDATE business_accounts
    SET total_amount = total_amount + v_cash_total
    WHERE id = v_business_account_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
