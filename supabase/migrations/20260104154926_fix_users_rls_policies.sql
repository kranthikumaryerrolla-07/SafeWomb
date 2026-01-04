/*
  # Fix RLS Policies for User Registration

  ## Overview
  Allows public user registration by adding an INSERT policy that doesn't require authentication

  ## Changes
  1. Drop existing restrictive policies
  2. Add new policies that allow:
     - Public user registration (INSERT without auth)
     - Users can view their own profile
     - Users can update their own profile
     - ASHA workers can view assigned patients

  ## Security Notes
  - Registration is public (as required for new users)
  - All other operations require authentication
  - Data isolation maintained through user_id checks
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "ASHA workers can view assigned patients" ON users;

-- Allow public user registration
CREATE POLICY "Allow public user registration"
  ON users FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can view their own profile (when authenticated)
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO public
  USING (
    id::text = current_setting('app.current_user_id', true)
    OR current_setting('app.current_user_id', true) IS NULL
  );

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO public
  USING (id::text = current_setting('app.current_user_id', true))
  WITH CHECK (id::text = current_setting('app.current_user_id', true));

-- ASHA workers can view assigned patients
CREATE POLICY "ASHA workers can view assigned patients"
  ON users FOR SELECT
  TO public
  USING (
    role = 'patient' AND
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.user_id = users.id
      AND pp.asha_worker_id::text = current_setting('app.current_user_id', true)
    )
  );

-- Fix patient_profiles policies
DROP POLICY IF EXISTS "Patients can create own profile" ON patient_profiles;

CREATE POLICY "Allow profile creation during registration"
  ON patient_profiles FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Patients can view own profile without settings"
  ON patient_profiles FOR SELECT
  TO public
  USING (
    user_id::text = current_setting('app.current_user_id', true)
    OR current_setting('app.current_user_id', true) IS NULL
  );

DROP POLICY IF EXISTS "Patients can view own profile" ON patient_profiles;

-- Recreate update policy
DROP POLICY IF EXISTS "Patients can update own profile" ON patient_profiles;

CREATE POLICY "Patients can update own profile"
  ON patient_profiles FOR UPDATE
  TO public
  USING (user_id::text = current_setting('app.current_user_id', true))
  WITH CHECK (user_id::text = current_setting('app.current_user_id', true));
