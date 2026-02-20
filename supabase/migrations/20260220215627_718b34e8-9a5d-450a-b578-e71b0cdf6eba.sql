
CREATE OR REPLACE FUNCTION public.fn_pos_session_opening_difference()
RETURNS TRIGGER AS $$
DECLARE
  v_movement_type_id bigint;
  v_movement_class_id bigint;
  v_payment_method_id bigint;
BEGIN
  IF NEW.opening_difference <> 0 THEN
    -- Update business account total_amount
    UPDATE business_accounts
    SET total_amount = total_amount + NEW.opening_difference
    WHERE id = NEW.business_account;

    -- Determine movement type: positive = Ingreso (INC/27), negative = Egreso (OUT/28)
    SELECT t.id INTO v_movement_type_id
    FROM types t
    JOIN modules m ON t.module_id = m.id
    WHERE m.code = 'MOV'
      AND t.code = CASE WHEN NEW.opening_difference > 0 THEN 'INC' ELSE 'OUT' END;

    -- Get Manual class from MOV module
    SELECT c.id INTO v_movement_class_id
    FROM classes c
    JOIN modules m ON c.module_id = m.id
    WHERE c.code = 'MAN' AND m.code = 'MOV';

    -- Get CASH payment method
    SELECT id INTO v_payment_method_id
    FROM payment_methods
    WHERE code = 'CASH';

    -- Insert movement record
    INSERT INTO movements (
      movement_type_id,
      movement_class_id,
      description,
      amount,
      movement_date,
      business_account_id,
      user_id,
      branch_id,
      payment_method_id
    ) VALUES (
      v_movement_type_id,
      v_movement_class_id,
      'Diferencia en apertura de punto de venta. Sesión: ' || NEW.id,
      ABS(NEW.opening_difference),
      NEW.opened_at,
      NEW.business_account,
      NEW.user_id,
      NEW.branch_id,
      v_payment_method_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS trg_pos_session_opening_difference ON pos_sessions;

CREATE TRIGGER trg_pos_session_opening_difference
AFTER INSERT ON pos_sessions
FOR EACH ROW
EXECUTE FUNCTION public.fn_pos_session_opening_difference();
