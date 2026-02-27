DROP TRIGGER IF EXISTS trg_create_movement_on_order_payment ON public.order_payment;
DROP FUNCTION IF EXISTS public.fn_create_movement_from_order_payment();