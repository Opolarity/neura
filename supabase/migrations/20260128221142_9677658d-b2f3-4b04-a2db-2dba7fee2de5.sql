-- Make the sales bucket public
UPDATE storage.buckets 
SET public = true 
WHERE id = 'sales';

-- Drop existing restrictive policies on sales bucket
DROP POLICY IF EXISTS "Authenticated users can upload sales vouchers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view sales vouchers" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads to sales bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from sales bucket" ON storage.objects;

-- Create fully permissive policies for the sales bucket
CREATE POLICY "Public read access for sales bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'sales');

CREATE POLICY "Public insert access for sales bucket"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'sales');

CREATE POLICY "Public update access for sales bucket"
ON storage.objects FOR UPDATE
USING (bucket_id = 'sales');

CREATE POLICY "Public delete access for sales bucket"
ON storage.objects FOR DELETE
USING (bucket_id = 'sales');