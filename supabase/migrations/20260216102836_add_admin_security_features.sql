/*
  # Add Admin Security Features

  1. New Tables
    - `login_attempts`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `email` (text)
      - `attempted_at` (timestamptz)
      - `ip_address` (text, optional)
      - `success` (boolean)
      - `user_agent` (text, optional)
  
  2. Changes to Profiles Table
    - Add `failed_login_attempts` (integer, default 0)
    - Add `locked_until` (timestamptz, nullable)
    - Add `last_login` (timestamptz, nullable)
    - Add `require_2fa` (boolean, default false)
    - Add `session_timeout_minutes` (integer, default 30 for admin, 120 for others)
  
  3. Security
    - Enable RLS on `login_attempts` table
    - Add policies for admin access to login attempts
    - Add function to reset failed login attempts
    - Add function to check if account is locked
*/

-- Add new columns to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'failed_login_attempts'
  ) THEN
    ALTER TABLE profiles ADD COLUMN failed_login_attempts INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'locked_until'
  ) THEN
    ALTER TABLE profiles ADD COLUMN locked_until TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_login'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_login TIMESTAMPTZ;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'require_2fa'
  ) THEN
    ALTER TABLE profiles ADD COLUMN require_2fa BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'session_timeout_minutes'
  ) THEN
    ALTER TABLE profiles ADD COLUMN session_timeout_minutes INTEGER DEFAULT 120;
  END IF;
END $$;

-- Update session timeout for admin users
UPDATE profiles 
SET session_timeout_minutes = 30, require_2fa = true 
WHERE role = 'admin';

-- Create login_attempts table
CREATE TABLE IF NOT EXISTS login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  attempted_at TIMESTAMPTZ DEFAULT now(),
  ip_address TEXT,
  success BOOLEAN DEFAULT false,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- Admin can view all login attempts
CREATE POLICY "Admins can view all login attempts"
  ON login_attempts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can view their own login attempts
CREATE POLICY "Users can view own login attempts"
  ON login_attempts FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- System can insert login attempts (public access for logging before auth)
CREATE POLICY "Allow insert login attempts"
  ON login_attempts FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Function to check if account is locked
CREATE OR REPLACE FUNCTION is_account_locked(user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_locked_until TIMESTAMPTZ;
BEGIN
  SELECT locked_until INTO user_locked_until
  FROM profiles
  WHERE email = user_email;
  
  IF user_locked_until IS NULL THEN
    RETURN false;
  END IF;
  
  IF user_locked_until > now() THEN
    RETURN true;
  ELSE
    -- Unlock account if lock period has expired
    UPDATE profiles 
    SET locked_until = NULL, failed_login_attempts = 0
    WHERE email = user_email;
    RETURN false;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record failed login attempt
CREATE OR REPLACE FUNCTION record_failed_login(user_email TEXT, ip_addr TEXT DEFAULT NULL, user_ag TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  user_profile_id UUID;
  current_attempts INTEGER;
  max_attempts INTEGER := 5;
  lock_duration INTERVAL := '15 minutes';
BEGIN
  -- Get user profile
  SELECT id, failed_login_attempts INTO user_profile_id, current_attempts
  FROM profiles
  WHERE email = user_email;
  
  -- Increment failed attempts
  current_attempts := current_attempts + 1;
  
  -- Update profile
  UPDATE profiles
  SET failed_login_attempts = current_attempts,
      locked_until = CASE 
        WHEN current_attempts >= max_attempts THEN now() + lock_duration
        ELSE locked_until
      END
  WHERE email = user_email;
  
  -- Log the attempt
  INSERT INTO login_attempts (user_id, email, attempted_at, ip_address, success, user_agent)
  VALUES (user_profile_id, user_email, now(), ip_addr, false, user_ag);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record successful login
CREATE OR REPLACE FUNCTION record_successful_login(user_email TEXT, ip_addr TEXT DEFAULT NULL, user_ag TEXT DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
  user_profile_id UUID;
BEGIN
  -- Get user profile
  SELECT id INTO user_profile_id
  FROM profiles
  WHERE email = user_email;
  
  -- Reset failed attempts and update last login
  UPDATE profiles
  SET failed_login_attempts = 0,
      locked_until = NULL,
      last_login = now()
  WHERE email = user_email;
  
  -- Log the successful attempt
  INSERT INTO login_attempts (user_id, email, attempted_at, ip_address, success, user_agent)
  VALUES (user_profile_id, user_email, now(), ip_addr, true, user_ag);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_login_attempts_email ON login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_login_attempts_attempted_at ON login_attempts(attempted_at);
CREATE INDEX IF NOT EXISTS idx_profiles_locked_until ON profiles(locked_until);
