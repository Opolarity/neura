-- Add UPDATE and DELETE policies for clients table
CREATE POLICY "Authenticated users can update clients" 
ON public.clients 
FOR UPDATE 
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can delete clients" 
ON public.clients 
FOR DELETE 
USING (true);