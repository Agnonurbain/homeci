/*
  # Add Notaire Role to HOMECI Platform

  ## Overview
  This migration adds the 'notaire' (notary) role to the profiles table to support
  notaries who verify property documents and legal compliance.

  ## Changes
  
  ### 1. Role Type Update
  - Adds 'notaire' to the existing role CHECK constraint
  - Allows profiles to be created with role 'notaire'
  
  ## Notes
  - Existing data is not affected
  - Notaries will have special permissions to verify property documents
  - RLS policies remain unchanged as notaries follow the same authentication patterns
*/

-- Drop the existing check constraint on role
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Add the new constraint with 'notaire' included
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('locataire', 'proprietaire', 'agent', 'admin', 'notaire'));
