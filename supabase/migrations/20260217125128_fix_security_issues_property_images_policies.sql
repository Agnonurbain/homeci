/*
  # Fix Security Issues - Property Images Policies

  ## Changes
  
  1. **Fix Multiple Permissive Policies**
     - Split the "Property owners can manage images" FOR ALL policy into separate policies
     - Keep SELECT policy separate for clarity
     - Add explicit INSERT, UPDATE, DELETE policies for owners only
     - This prevents multiple permissive policies for the same action
  
  2. **Verify Function Search Paths**
     - Ensure record_failed_login has immutable search_path
     - Ensure record_successful_login has immutable search_path
     - Both functions set to `SET search_path = public`
  
  ## Security Improvements
  - Eliminates policy overlap warnings
  - Maintains secure access control
  - Ensures functions execute in predictable schema context
  
  ## Note
  - Unused indexes are kept as they will be utilized as the application grows
  - Auth DB connection strategy must be configured in Supabase Dashboard
  - Leaked password protection must be enabled in Supabase Dashboard under Auth settings
*/

-- Drop existing policies on property_images to recreate them properly
DROP POLICY IF EXISTS "Users can view property images" ON property_images;
DROP POLICY IF EXISTS "Property owners can manage images" ON property_images;

-- Create separate, non-overlapping policies for property_images

-- Policy 1: Anyone can view images of available properties or their own properties
CREATE POLICY "Users can view property images"
  ON property_images FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = property_images.property_id
      AND (p.status = 'available' OR p.owner_id = auth.uid())
    )
  );

-- Policy 2: Property owners can insert images for their properties
CREATE POLICY "Property owners can insert images"
  ON property_images FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = property_images.property_id 
      AND owner_id = auth.uid()
    )
  );

-- Policy 3: Property owners can update images for their properties
CREATE POLICY "Property owners can update images"
  ON property_images FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = property_images.property_id 
      AND owner_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = property_images.property_id 
      AND owner_id = auth.uid()
    )
  );

-- Policy 4: Property owners can delete images for their properties
CREATE POLICY "Property owners can delete images"
  ON property_images FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = property_images.property_id 
      AND owner_id = auth.uid()
    )
  );

-- Recreate functions with explicit search_path to ensure immutability
CREATE OR REPLACE FUNCTION record_failed_login(user_email text, ip_addr text DEFAULT NULL, user_ag text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile_id uuid;
  current_attempts integer;
  max_attempts integer := 5;
  lockout_duration interval := '30 minutes';
BEGIN
  SELECT id INTO user_profile_id
  FROM profiles
  WHERE email = user_email;

  IF user_profile_id IS NOT NULL THEN
    INSERT INTO login_attempts (user_id, email, attempted_at, ip_address, successful, user_agent)
    VALUES (user_profile_id, user_email, now(), ip_addr, false, user_ag);

    SELECT COUNT(*) INTO current_attempts
    FROM login_attempts
    WHERE email = user_email
      AND successful = false
      AND attempted_at > now() - interval '1 hour';

    IF current_attempts >= max_attempts THEN
      UPDATE profiles
      SET locked_until = now() + lockout_duration,
          failed_login_attempts = current_attempts
      WHERE email = user_email;
    END IF;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION record_successful_login(user_email text, ip_addr text DEFAULT NULL, user_ag text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile_id uuid;
BEGIN
  SELECT id INTO user_profile_id
  FROM profiles
  WHERE email = user_email;

  IF user_profile_id IS NOT NULL THEN
    INSERT INTO login_attempts (user_id, email, attempted_at, ip_address, successful, user_agent)
    VALUES (user_profile_id, user_email, now(), ip_addr, true, user_ag);

    UPDATE profiles
    SET locked_until = NULL,
        failed_login_attempts = 0,
        last_login_at = now()
    WHERE email = user_email;
  END IF;
END;
$$;
