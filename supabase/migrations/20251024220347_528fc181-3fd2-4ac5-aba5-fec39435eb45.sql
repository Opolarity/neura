-- Ensure RLS allows writing to categories
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert categories
CREATE POLICY "Authenticated users can insert categories"
ON public.categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow authenticated users to update categories
CREATE POLICY "Authenticated users can update categories"
ON public.categories
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Allow authenticated users to delete categories
CREATE POLICY "Authenticated users can delete categories"
ON public.categories
FOR DELETE
TO authenticated
USING (true);