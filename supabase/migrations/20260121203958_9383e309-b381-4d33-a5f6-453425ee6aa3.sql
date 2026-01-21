-- Add RLS policies for term_groups table to allow authenticated users to manage attributes

-- Policy for SELECT (read)
CREATE POLICY "Authenticated users can view term_groups"
ON public.term_groups
FOR SELECT
TO authenticated
USING (true);

-- Policy for INSERT (create)
CREATE POLICY "Authenticated users can create term_groups"
ON public.term_groups
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy for UPDATE
CREATE POLICY "Authenticated users can update term_groups"
ON public.term_groups
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Policy for DELETE
CREATE POLICY "Authenticated users can delete term_groups"
ON public.term_groups
FOR DELETE
TO authenticated
USING (true);