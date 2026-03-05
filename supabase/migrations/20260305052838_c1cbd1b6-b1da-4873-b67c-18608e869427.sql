CREATE POLICY "Enable update for authenticated users"
ON public.linked_stock_movement_requests
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);