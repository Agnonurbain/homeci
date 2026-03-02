/*
  # Update Storage Limits to 5GB (Supabase Maximum)

  1. Changes
    - Reduce file size limit from 10GB to 5GB (Supabase's hard limit)
    - Keep video format support unchanged

  2. Rationale
    - Supabase has a hard limit of 5GB per file across all plans
    - This limit cannot be exceeded regardless of bucket configuration
    - Better to enforce this limit on the database side

  3. Important Notes
    - Storage bucket configuration update
    - No data migration required
    - Users will need to compress videos larger than 5GB
*/

UPDATE storage.buckets
SET file_size_limit = 5368709120
WHERE id = 'property-media';
