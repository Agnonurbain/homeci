/*
  # Update Storage Limits for Large Videos

  1. Changes
    - Increase file size limit from 5GB to 10GB to support 30-minute 4K videos
    - Update allowed MIME types to support more video formats
    - Add support for modern video codecs (AV1, HEVC)

  2. Rationale
    - 30-minute videos at high quality can easily exceed 5GB
    - Modern video formats provide better compression
    - Support for various video recording devices and formats

  3. Important Notes
    - Storage bucket configuration update
    - No data migration required
    - Backwards compatible with existing uploads
*/

UPDATE storage.buckets
SET 
  file_size_limit = 10737418240,
  allowed_mime_types = ARRAY[
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'image/webp', 
    'image/gif', 
    'image/avif',
    'video/mp4', 
    'video/webm', 
    'video/quicktime', 
    'video/x-msvideo',
    'video/x-matroska',
    'video/avi'
  ]
WHERE id = 'property-media';
