/*
  # Setup Property Media Storage

  1. Storage Setup
    - Create 'property-media' storage bucket for images and videos
    - Enable public access for viewing media
    - Set size limits: 5GB per file (supports large 4K videos and extensive media collections)
    - Allow authenticated users to upload
    - Allow owners to delete their own media

  2. Security
    - RLS policies for upload (authenticated users only)
    - RLS policies for delete (owners only)
    - Public read access for all media
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-media',
  'property-media',
  true,
  5368709120,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can upload property media"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'property-media');

CREATE POLICY "Users can update their own property media"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'property-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own property media"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'property-media' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view property media"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'property-media');
