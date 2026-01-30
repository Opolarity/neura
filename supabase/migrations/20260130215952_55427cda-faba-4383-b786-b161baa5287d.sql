-- Habilitar RLS en pos_session_orders
ALTER TABLE public.pos_session_orders ENABLE ROW LEVEL SECURITY;

-- Permitir a usuarios autenticados insertar vínculos de sus propias sesiones
CREATE POLICY "Users can link orders to their POS sessions"
ON public.pos_session_orders
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.pos_sessions ps
    WHERE ps.id = pos_session_orders.pos_session_id
    AND ps.user_id = auth.uid()
  )
);

-- Permitir a usuarios autenticados ver los vínculos de sus sesiones
CREATE POLICY "Users can view their POS session orders"
ON public.pos_session_orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.pos_sessions ps
    WHERE ps.id = pos_session_orders.pos_session_id
    AND ps.user_id = auth.uid()
  )
);