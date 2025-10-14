-- Enable RLS policies for shipping_methods table
CREATE POLICY "Authenticated users can view shipping methods"
ON public.shipping_methods
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create shipping methods"
ON public.shipping_methods
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update shipping methods"
ON public.shipping_methods
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete shipping methods"
ON public.shipping_methods
FOR DELETE
TO authenticated
USING (true);

-- Enable RLS policies for shipping_costs table
CREATE POLICY "Authenticated users can view shipping costs"
ON public.shipping_costs
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can create shipping costs"
ON public.shipping_costs
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update shipping costs"
ON public.shipping_costs
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete shipping costs"
ON public.shipping_costs
FOR DELETE
TO authenticated
USING (true);