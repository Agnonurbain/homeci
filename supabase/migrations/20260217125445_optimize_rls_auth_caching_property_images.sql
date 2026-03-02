/*
  # Optimize RLS Auth Function Caching - Property Images

  ## Performance Optimization
  
  This migration fixes Auth RLS Initialization Plan issues by caching auth function results.
  
  ### Problem
  The property_images RLS policies were calling `auth.uid()` directly, which causes the function
  to be re-evaluated for every row in the result set. This creates significant performance
  overhead at scale.
  
  ### Solution
  Replace `auth.uid()` with `(select auth.uid())` in all policies. The subquery forces
  PostgreSQL to evaluate the auth function once and cache the result for the entire query
  execution, dramatically improving performance.
  
  ## Changes
  
  1. **Drop and recreate all property_images policies with optimized auth caching:**
     - Users can view property images (SELECT)
     - Property owners can insert images (INSERT)
     - Property owners can update images (UPDATE)
     - Property owners can delete images (DELETE)
  
  ## Performance Impact
  - Reduces query execution time for row-level security checks
  - Eliminates redundant auth function calls
  - Scales efficiently with large datasets
  
  ## Security
  - Maintains identical security posture
  - No changes to access control logic
  - Only optimizes performance of existing policies
*/

-- Drop existing property_images policies
DROP POLICY IF EXISTS "Users can view property images" ON property_images;
DROP POLICY IF EXISTS "Property owners can insert images" ON property_images;
DROP POLICY IF EXISTS "Property owners can update images" ON property_images;
DROP POLICY IF EXISTS "Property owners can delete images" ON property_images;

-- Recreate policies with optimized auth function caching

-- Policy 1: SELECT - Users can view images of available properties or their own properties
CREATE POLICY "Users can view property images"
  ON property_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_images.property_id
      AND (p.status = 'available' OR p.owner_id = (select auth.uid()))
    )
  );

-- Policy 2: INSERT - Property owners can insert images for their properties
CREATE POLICY "Property owners can insert images"
  ON property_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = property_images.property_id 
      AND owner_id = (select auth.uid())
    )
  );

-- Policy 3: UPDATE - Property owners can update images for their properties
CREATE POLICY "Property owners can update images"
  ON property_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = property_images.property_id 
      AND owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = property_images.property_id 
      AND owner_id = (select auth.uid())
    )
  );

-- Policy 4: DELETE - Property owners can delete images for their properties
CREATE POLICY "Property owners can delete images"
  ON property_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = property_images.property_id 
      AND owner_id = (select auth.uid())
    )
  );
