-- Enable RLS on order_status table
ALTER TABLE public.order_status ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to view order status for their orders
CREATE POLICY "Users can view their order status"
ON public.order_status
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_status.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Policy to allow authenticated users to insert order status for their orders
CREATE POLICY "Users can insert status for their orders"
ON public.order_status
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_status.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Policy to allow authenticated users to update order status for their orders
CREATE POLICY "Users can update their order status"
ON public.order_status
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_status.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Policy to allow authenticated users to delete order status for their orders
CREATE POLICY "Users can delete their order status"
ON public.order_status
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_status.order_id
    AND orders.user_id = auth.uid()
  )
);