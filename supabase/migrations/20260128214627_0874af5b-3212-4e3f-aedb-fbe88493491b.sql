-- Add RLS policies for sale-vouchers folder in sales bucket

-- Allow authenticated users to upload vouchers to sale-vouchers folder
CREATE POLICY "Allow authenticated users to upload sale vouchers"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'sales' AND 
  (storage.foldername(name))[1] = 'sale-vouchers'
);

-- Allow authenticated users to view sale vouchers
CREATE POLICY "Allow authenticated users to view sale vouchers"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'sales' AND 
  (storage.foldername(name))[1] = 'sale-vouchers'
);

-- Allow authenticated users to update sale vouchers
CREATE POLICY "Allow authenticated users to update sale vouchers"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'sales' AND 
  (storage.foldername(name))[1] = 'sale-vouchers'
);

-- Allow authenticated users to delete sale vouchers
CREATE POLICY "Allow authenticated users to delete sale vouchers"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'sales' AND 
  (storage.foldername(name))[1] = 'sale-vouchers'
);