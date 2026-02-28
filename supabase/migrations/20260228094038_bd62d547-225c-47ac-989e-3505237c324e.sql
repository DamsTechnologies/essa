
-- Tighten storage policies to require authentication
DROP POLICY IF EXISTS "Anyone can upload contestant images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update contestant images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can delete contestant images" ON storage.objects;

CREATE POLICY "Authenticated users can upload contestant images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'contestant-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update contestant images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'contestant-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete contestant images" ON storage.objects
  FOR DELETE USING (bucket_id = 'contestant-images' AND auth.role() = 'authenticated');
