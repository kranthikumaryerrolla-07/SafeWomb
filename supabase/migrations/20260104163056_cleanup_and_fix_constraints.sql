/*
  # Cleanup and Fix Foreign Key Constraints

  1. Changes
    - Remove orphaned patient_profiles records
    - Drop existing foreign key constraint pointing to public.users
    - Add new foreign key constraint pointing to auth.users
    
  2. Notes
    - This migration removes test data with invalid references
    - Aligns the database schema with Supabase Auth
*/

DELETE FROM patient_profiles
WHERE user_id NOT IN (SELECT id FROM auth.users);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'patient_profiles_user_id_fkey'
    AND table_name = 'patient_profiles'
  ) THEN
    ALTER TABLE patient_profiles DROP CONSTRAINT patient_profiles_user_id_fkey;
  END IF;
END $$;

ALTER TABLE patient_profiles
  ADD CONSTRAINT patient_profiles_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;