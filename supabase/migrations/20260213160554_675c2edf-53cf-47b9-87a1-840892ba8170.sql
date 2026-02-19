
CREATE POLICY "Allow authenticated uploads to medios"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ecommerce'
  AND (storage.foldername(name))[1] = 'medios'
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Allow authenticated read medios"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ecommerce'
  AND (storage.foldername(name))[1] = 'medios'
);

CREATE POLICY "Allow authenticated delete medios"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'ecommerce'
  AND (storage.foldername(name))[1] = 'medios'
  AND auth.role() = 'authenticated'
);
