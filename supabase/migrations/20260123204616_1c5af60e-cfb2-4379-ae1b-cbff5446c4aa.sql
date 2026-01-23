-- Add RLS policies for sales-notes folder in the sales bucket

-- Policy to allow authenticated users to upload note images
CREATE POLICY "Allow authenticated users to upload note images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'sales' AND 
  (storage.foldername(name))[1] = 'sales-notes'
);

-- Policy to allow authenticated users to view note images
CREATE POLICY "Allow authenticated users to view note images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'sales' AND 
  (storage.foldername(name))[1] = 'sales-notes'
);

-- Policy to allow authenticated users to update note images (for upsert)
CREATE POLICY "Allow authenticated users to update note images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'sales' AND 
  (storage.foldername(name))[1] = 'sales-notes'
);