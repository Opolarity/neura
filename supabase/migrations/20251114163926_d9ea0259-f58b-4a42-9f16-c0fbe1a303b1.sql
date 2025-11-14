-- Eliminar el trigger primero
DROP TRIGGER IF EXISTS trigger_process_order_confirmation ON order_situations;

-- Ahora eliminar la función
DROP FUNCTION IF EXISTS public.process_order_confirmation();