-- Add RLS policies for types table
CREATE POLICY "Authenticated users can view types"
ON public.types
FOR SELECT
TO authenticated
USING (true);

-- Add RLS policies for situations table
CREATE POLICY "Authenticated users can view situations"
ON public.situations
FOR SELECT
TO authenticated
USING (true);

-- Add RLS policies for modules table
CREATE POLICY "Authenticated users can view modules"
ON public.modules
FOR SELECT
TO authenticated
USING (true);