-- Add UPDATE policy for order_payment table
-- This allows authenticated users to update their own order payments (e.g., to add voucher_url after upload)

CREATE POLICY "Users can update their order payments"
ON public.order_payment
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_payment.order_id
  AND orders.user_id = auth.uid()
))
WITH CHECK (EXISTS (
  SELECT 1 FROM orders
  WHERE orders.id = order_payment.order_id
  AND orders.user_id = auth.uid()
));