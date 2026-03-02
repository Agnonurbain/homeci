/*
  # Fix Security and Performance Issues

  ## Changes Made

  ### 1. Foreign Key Indexes (Performance)
  Add indexes on all foreign key columns to improve query performance:
  - admin_credential_requests.reviewed_by
  - alerts.user_id
  - favorites.property_id
  - login_attempts.user_id
  - messages.property_id
  - property_documents.property_id, verified_by
  - property_images.property_id
  - transactions.booking_id, property_id, user_id

  ### 2. RLS Policy Optimization
  Update all policies to use `(select auth.uid())` instead of `auth.uid()` to prevent
  re-evaluation for each row, improving performance at scale.

  ### 3. Function Security
  Fix mutable search_path vulnerability by setting explicit search_path on all functions.

  ### 4. Consolidate Duplicate Policies
  Combine multiple permissive SELECT policies into single policies where appropriate.

  ### 5. Fix Overly Permissive Policies
  Restrict the login_attempts INSERT policy to prevent unrestricted access.

  ## Security Impact
  - Prevents search_path injection attacks
  - Improves RLS performance significantly
  - Removes overly permissive access patterns
  - Optimizes query performance with proper indexes
*/

-- =============================================
-- 1. ADD FOREIGN KEY INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_admin_credential_requests_reviewed_by 
  ON admin_credential_requests(reviewed_by);

CREATE INDEX IF NOT EXISTS idx_alerts_user_id 
  ON alerts(user_id);

CREATE INDEX IF NOT EXISTS idx_favorites_property_id 
  ON favorites(property_id);

CREATE INDEX IF NOT EXISTS idx_login_attempts_user_id 
  ON login_attempts(user_id);

CREATE INDEX IF NOT EXISTS idx_messages_property_id 
  ON messages(property_id);

CREATE INDEX IF NOT EXISTS idx_property_documents_property_id 
  ON property_documents(property_id);

CREATE INDEX IF NOT EXISTS idx_property_documents_verified_by 
  ON property_documents(verified_by);

CREATE INDEX IF NOT EXISTS idx_property_images_property_id 
  ON property_images(property_id);

CREATE INDEX IF NOT EXISTS idx_transactions_booking_id 
  ON transactions(booking_id);

CREATE INDEX IF NOT EXISTS idx_transactions_property_id 
  ON transactions(property_id);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id 
  ON transactions(user_id);

-- =============================================
-- 2. FIX FUNCTION SEARCH PATHS
-- =============================================

CREATE OR REPLACE FUNCTION is_account_locked(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  locked_until_val timestamptz;
BEGIN
  SELECT locked_until INTO locked_until_val
  FROM profiles
  WHERE email = user_email;
  
  RETURN locked_until_val IS NOT NULL AND locked_until_val > now();
END;
$$;

CREATE OR REPLACE FUNCTION record_failed_login(user_email text, ip_addr text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile_id uuid;
  recent_attempts integer;
BEGIN
  SELECT id INTO user_profile_id FROM profiles WHERE email = user_email;
  
  INSERT INTO login_attempts (user_id, email, ip_address, success, attempted_at)
  VALUES (user_profile_id, user_email, ip_addr, false, now());
  
  SELECT COUNT(*) INTO recent_attempts
  FROM login_attempts
  WHERE email = user_email
    AND success = false
    AND attempted_at > now() - interval '15 minutes';
  
  IF recent_attempts >= 5 THEN
    UPDATE profiles
    SET locked_until = now() + interval '30 minutes'
    WHERE email = user_email;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION record_successful_login(user_email text, ip_addr text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile_id uuid;
BEGIN
  SELECT id INTO user_profile_id FROM profiles WHERE email = user_email;
  
  INSERT INTO login_attempts (user_id, email, ip_address, success, attempted_at)
  VALUES (user_profile_id, user_email, ip_addr, true, now());
  
  UPDATE profiles
  SET locked_until = NULL
  WHERE email = user_email;
END;
$$;

CREATE OR REPLACE FUNCTION is_admin_principal()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
    AND email = 'ned12@gmail.com'
  );
END;
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =============================================
-- 3. DROP AND RECREATE RLS POLICIES WITH OPTIMIZATION
-- =============================================

-- PROFILES TABLE
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- PROPERTIES TABLE
DROP POLICY IF EXISTS "Anyone can view published properties" ON properties;
DROP POLICY IF EXISTS "Owners can insert own properties" ON properties;
DROP POLICY IF EXISTS "Owners can update own properties" ON properties;
DROP POLICY IF EXISTS "Owners can delete own properties" ON properties;

CREATE POLICY "Anyone can view published properties"
  ON properties FOR SELECT
  TO authenticated
  USING (
    status = 'available' 
    OR owner_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('admin', 'notaire')
    )
  );

CREATE POLICY "Owners can insert own properties"
  ON properties FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Owners can update own properties"
  ON properties FOR UPDATE
  TO authenticated
  USING (owner_id = (select auth.uid()))
  WITH CHECK (owner_id = (select auth.uid()));

CREATE POLICY "Owners can delete own properties"
  ON properties FOR DELETE
  TO authenticated
  USING (owner_id = (select auth.uid()));

-- PROPERTY_IMAGES TABLE - Consolidate duplicate policies
DROP POLICY IF EXISTS "Anyone can view property images" ON property_images;
DROP POLICY IF EXISTS "Property owners can manage images" ON property_images;

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

CREATE POLICY "Property owners can manage images"
  ON property_images FOR ALL
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

-- PROPERTY_DOCUMENTS TABLE
DROP POLICY IF EXISTS "Property owners can view own documents" ON property_documents;
DROP POLICY IF EXISTS "Property owners can upload documents" ON property_documents;

CREATE POLICY "Property owners can view own documents"
  ON property_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = property_documents.property_id 
      AND owner_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role IN ('admin', 'notaire')
    )
  );

CREATE POLICY "Property owners can upload documents"
  ON property_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM properties 
      WHERE id = property_documents.property_id 
      AND owner_id = (select auth.uid())
    )
  );

-- FAVORITES TABLE - Consolidate duplicate policies
DROP POLICY IF EXISTS "Users can view own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;

CREATE POLICY "Users can manage own favorites"
  ON favorites FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- BOOKINGS TABLE
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update own bookings" ON bookings;

CREATE POLICY "Users can view own bookings"
  ON bookings FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM properties 
      WHERE id = bookings.property_id 
      AND owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create bookings"
  ON bookings FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can update own bookings"
  ON bookings FOR UPDATE
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM properties 
      WHERE id = bookings.property_id 
      AND owner_id = (select auth.uid())
    )
  )
  WITH CHECK (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM properties 
      WHERE id = bookings.property_id 
      AND owner_id = (select auth.uid())
    )
  );

-- TRANSACTIONS TABLE
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create transactions" ON transactions;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM properties 
      WHERE id = transactions.property_id 
      AND owner_id = (select auth.uid())
    )
  );

CREATE POLICY "Users can create transactions"
  ON transactions FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (select auth.uid()));

-- MESSAGES TABLE
DROP POLICY IF EXISTS "Users can view own messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages" ON messages;
DROP POLICY IF EXISTS "Users can mark messages as read" ON messages;

CREATE POLICY "Users can view own messages"
  ON messages FOR SELECT
  TO authenticated
  USING (
    sender_id = (select auth.uid()) 
    OR receiver_id = (select auth.uid())
  );

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = (select auth.uid()));

CREATE POLICY "Users can mark messages as read"
  ON messages FOR UPDATE
  TO authenticated
  USING (receiver_id = (select auth.uid()))
  WITH CHECK (receiver_id = (select auth.uid()));

-- ALERTS TABLE
DROP POLICY IF EXISTS "Users can manage own alerts" ON alerts;

CREATE POLICY "Users can manage own alerts"
  ON alerts FOR ALL
  TO authenticated
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- LOGIN_ATTEMPTS TABLE - Consolidate and fix overly permissive policy
DROP POLICY IF EXISTS "Allow insert login attempts" ON login_attempts;
DROP POLICY IF EXISTS "Users can view own login attempts" ON login_attempts;
DROP POLICY IF EXISTS "Admins can view all login attempts" ON login_attempts;

CREATE POLICY "System can insert login attempts"
  ON login_attempts FOR INSERT
  TO authenticated
  WITH CHECK (
    email = (SELECT email FROM profiles WHERE id = (select auth.uid()))
  );

CREATE POLICY "Users and admins can view login attempts"
  ON login_attempts FOR SELECT
  TO authenticated
  USING (
    user_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'admin'
    )
  );

-- ADMIN_CREDENTIAL_REQUESTS TABLE - Consolidate policies
DROP POLICY IF EXISTS "Admins can view own credential requests" ON admin_credential_requests;
DROP POLICY IF EXISTS "Admin principal can view all credential requests" ON admin_credential_requests;
DROP POLICY IF EXISTS "Admins can create credential change requests" ON admin_credential_requests;

CREATE POLICY "Admins can view credential requests"
  ON admin_credential_requests FOR SELECT
  TO authenticated
  USING (
    admin_id = (select auth.uid())
    OR EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'admin' 
      AND email = 'ned12@gmail.com'
    )
  );

CREATE POLICY "Admins can create credential change requests"
  ON admin_credential_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_id = (select auth.uid())
    AND EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = (select auth.uid()) 
      AND role = 'admin'
    )
  );