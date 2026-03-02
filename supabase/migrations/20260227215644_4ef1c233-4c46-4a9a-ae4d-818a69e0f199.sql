-- Trigger function: on order_payment insert, create a movement record
CREATE OR REPLACE FUNCTION public.fn_create_movement_from_order_payment()
RETURNS TRIGGER AS $$
DECLARE
  v_type_id bigint;
  v_class_id bigint;
  v_movement_id bigint;
BEGIN
  -- Determine type: INC for positive, OUT for negative
  IF NEW.amount >= 0 THEN
    SELECT id INTO v_type_id FROM public.types WHERE code = 'INC' AND module_id = (SELECT id FROM public.modules WHERE code = 'MOV' LIMIT 1) LIMIT 1;
  ELSE
    SELECT id INTO v_type_id FROM public.types WHERE code = 'OUT' AND module_id = (SELECT id FROM public.modules WHERE code = 'MOV' LIMIT 1) LIMIT 1;
  END IF;

  IF v_type_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró el type INC/OUT en module MOV';
  END IF;

  -- Get class ORD from module MOV (ventas)
  SELECT id INTO v_class_id FROM public.classes WHERE code = 'ORD' AND module_id = (SELECT id FROM public.modules WHERE code = 'MOV' LIMIT 1) LIMIT 1;

  IF v_class_id IS NULL THEN
    RAISE EXCEPTION 'No se encontró la class ORD en module MOV';
  END IF;

  -- Insert movement using order data
  INSERT INTO public.movements (
    amount,
    branch_id,
    business_account_id,
    movement_date,
    movement_type_id,
    movement_class_id,
    payment_method_id,
    user_id,
    description
  )
  SELECT
    ABS(NEW.amount),
    o.branch_id,
    NEW.business_acount_id,
    NEW.date,
    v_type_id,
    v_class_id,
    NEW.payment_method_id,
    o.user_id,
    'Pago de orden #' || NEW.order_id
  FROM public.orders o
  WHERE o.id = NEW.order_id
  RETURNING id INTO v_movement_id;

  -- Set movement_id on the order_payment row
  NEW.movement_id := v_movement_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger (BEFORE INSERT so we can set movement_id)
DROP TRIGGER IF EXISTS trg_create_movement_on_order_payment ON public.order_payment;
CREATE TRIGGER trg_create_movement_on_order_payment
  BEFORE INSERT ON public.order_payment
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_create_movement_from_order_payment();