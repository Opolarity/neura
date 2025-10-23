-- Enable RLS on statuses table if not already enabled
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to view statuses
CREATE POLICY "Authenticated users can view statuses"
ON public.statuses
FOR SELECT
TO authenticated
USING (true);

-- Create policy to allow authenticated users to insert statuses (for admins/system)
CREATE POLICY "Authenticated users can create statuses"
ON public.statuses
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create policy to allow authenticated users to update statuses
CREATE POLICY "Authenticated users can update statuses"
ON public.statuses
FOR UPDATE
TO authenticated
USING (true);

-- Create policy to allow authenticated users to delete statuses
CREATE POLICY "Authenticated users can delete statuses"
ON public.statuses
FOR DELETE
TO authenticated
USING (true);