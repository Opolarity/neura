-- Enable RLS on clients table
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read clients
CREATE POLICY "Authenticated users can view clients"
ON public.clients
FOR SELECT
TO authenticated
USING (true);

-- Allow authenticated users to insert clients
CREATE POLICY "Authenticated users can create clients"
ON public.clients
FOR INSERT
TO authenticated
WITH CHECK (true);