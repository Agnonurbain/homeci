/*
  # Admin Credential Management System

  1. New Tables
    - `admin_credential_requests`
      - `id` (uuid, primary key)
      - `admin_id` (uuid, references profiles.id)
      - `new_email` (text, nullable) - New email if changing email
      - `request_type` (text) - 'email_change', 'password_change', or 'both'
      - `status` (text) - 'pending', 'approved', 'rejected'
      - `requested_at` (timestamptz)
      - `reviewed_at` (timestamptz, nullable)
      - `reviewed_by` (uuid, references profiles.id, nullable)
      - `notes` (text, nullable)

  2. Security
    - Enable RLS on `admin_credential_requests` table
    - Admins can view their own requests
    - Only admin principal can view all requests and approve/reject
    - Add function to check if user is admin principal

  3. Data
    - Create admin principal account (will be created via auth.users)
    - Note: The actual auth user creation must be done separately via Supabase Auth
*/

-- Create admin credential requests table
CREATE TABLE IF NOT EXISTS admin_credential_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  new_email text,
  request_type text NOT NULL CHECK (request_type IN ('email_change', 'password_change', 'both')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at timestamptz DEFAULT now() NOT NULL,
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  notes text
);

-- Enable RLS
ALTER TABLE admin_credential_requests ENABLE ROW LEVEL SECURITY;

-- Function to check if a user is the admin principal
CREATE OR REPLACE FUNCTION is_admin_principal()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Policy: Admins can view their own requests
CREATE POLICY "Admins can view own credential requests"
  ON admin_credential_requests
  FOR SELECT
  TO authenticated
  USING (
    admin_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Admin principal can view all requests
CREATE POLICY "Admin principal can view all credential requests"
  ON admin_credential_requests
  FOR SELECT
  TO authenticated
  USING (is_admin_principal());

-- Policy: Admins can create their own credential change requests
CREATE POLICY "Admins can create credential change requests"
  ON admin_credential_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    admin_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'admin'
    )
  );

-- Policy: Admin principal can update requests (approve/reject)
CREATE POLICY "Admin principal can update credential requests"
  ON admin_credential_requests
  FOR UPDATE
  TO authenticated
  USING (is_admin_principal())
  WITH CHECK (is_admin_principal());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_credential_requests_admin_id ON admin_credential_requests(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_credential_requests_status ON admin_credential_requests(status);
CREATE INDEX IF NOT EXISTS idx_admin_credential_requests_requested_at ON admin_credential_requests(requested_at DESC);
