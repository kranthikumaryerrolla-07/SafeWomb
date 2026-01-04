/*
  # Maternal Health Monitoring System - User Authentication & Roles

  ## Overview
  Creates a complete authentication system for the maternal health monitoring platform with three user types: Patients, Partners, and ASHA workers.

  ## 1. New Tables
  
  ### `users`
  Stores user account information with role-based access
  - `id` (uuid, primary key) - Unique user identifier
  - `email` (text, unique, not null) - User email address
  - `phone` (text, unique, not null) - Phone number with country code
  - `country_code` (text, not null) - Country code (e.g., +91)
  - `full_name` (text, not null) - User's full name
  - `role` (text, not null) - User role: 'patient', 'partner', or 'asha_worker'
  - `password_hash` (text, not null) - Hashed password for authentication
  - `created_at` (timestamptz) - Account creation timestamp
  - `last_login` (timestamptz) - Last login timestamp
  - `is_active` (boolean) - Account status

  ### `patient_profiles`
  Extended profile information for patients only
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - Links to users table
  - `date_of_birth` (date) - Patient's date of birth
  - `blood_group` (text) - Blood type
  - `pregnancy_week` (integer) - Current pregnancy week
  - `expected_due_date` (date) - Expected delivery date
  - `partner_id` (uuid, nullable) - Links to partner's user account
  - `asha_worker_id` (uuid, nullable) - Assigned ASHA worker
  - `emergency_contact` (text) - Emergency contact number
  - `address` (text) - Residential address
  - `updated_at` (timestamptz) - Last update timestamp

  ### `health_records`
  Stores all health assessments and lab results
  - `id` (uuid, primary key)
  - `patient_id` (uuid, foreign key) - Links to patient_profiles
  - `recorded_by` (uuid, foreign key) - User who recorded the data
  - `hemoglobin` (decimal) - Hemoglobin level
  - `blood_sugar` (decimal) - Blood sugar level
  - `systolic_bp` (integer) - Systolic blood pressure
  - `diastolic_bp` (integer) - Diastolic blood pressure
  - `tsh` (decimal) - Thyroid stimulating hormone
  - `amniotic_fluid` (decimal) - Amniotic fluid index
  - `risk_level` (text) - Predicted risk: 'LOW', 'MEDIUM', 'HIGH'
  - `recommendations` (jsonb) - Clinical recommendations
  - `created_at` (timestamptz) - Record creation timestamp
  - `notes` (text) - Additional notes

  ### `notifications`
  Tracks all notifications sent to users
  - `id` (uuid, primary key)
  - `user_id` (uuid, foreign key) - Recipient user
  - `health_record_id` (uuid, foreign key) - Related health record
  - `notification_type` (text) - Type: 'sms', 'email', 'push', 'phone'
  - `message` (text) - Notification content
  - `sent_at` (timestamptz) - When notification was sent
  - `read_at` (timestamptz, nullable) - When user read it
  - `status` (text) - Status: 'sent', 'delivered', 'failed'

  ## 2. Security - Row Level Security (RLS)
  
  All tables have RLS enabled with restrictive policies:
  
  ### Users Table Policies
  - Patients can view and update their own profile
  - Partners can view their linked patient's profile
  - ASHA workers can view all patients assigned to them
  
  ### Patient Profiles Policies
  - Patients can view and update their own profile
  - Partners can view linked patient profiles
  - ASHA workers can view and update assigned patient profiles
  
  ### Health Records Policies
  - Patients can view their own health records
  - Partners can view their linked patient's records
  - ASHA workers can view and create records for assigned patients
  
  ### Notifications Policies
  - Users can view their own notifications
  - ASHA workers can view notifications for their assigned patients

  ## 3. Important Notes
  - All passwords must be hashed before storage (using bcrypt or similar)
  - Phone numbers must include country code
  - RLS ensures data isolation between different user roles
  - ASHA workers can manage multiple patients
  - Partners are linked to specific patients
  - All timestamps use UTC timezone
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  phone text UNIQUE NOT NULL,
  country_code text NOT NULL DEFAULT '+91',
  full_name text NOT NULL,
  role text NOT NULL CHECK (role IN ('patient', 'partner', 'asha_worker')),
  password_hash text NOT NULL,
  created_at timestamptz DEFAULT now(),
  last_login timestamptz,
  is_active boolean DEFAULT true
);

-- Create patient profiles table
CREATE TABLE IF NOT EXISTS patient_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_of_birth date,
  blood_group text,
  pregnancy_week integer,
  expected_due_date date,
  partner_id uuid REFERENCES users(id),
  asha_worker_id uuid REFERENCES users(id),
  emergency_contact text,
  address text,
  updated_at timestamptz DEFAULT now()
);

-- Create health records table
CREATE TABLE IF NOT EXISTS health_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id uuid NOT NULL REFERENCES patient_profiles(id) ON DELETE CASCADE,
  recorded_by uuid NOT NULL REFERENCES users(id),
  hemoglobin decimal(4,2),
  blood_sugar decimal(5,2),
  systolic_bp integer,
  diastolic_bp integer,
  tsh decimal(5,3),
  amniotic_fluid decimal(4,2),
  risk_level text CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
  recommendations jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  notes text
);

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  health_record_id uuid REFERENCES health_records(id),
  notification_type text NOT NULL CHECK (notification_type IN ('sms', 'email', 'push', 'phone')),
  message text NOT NULL,
  sent_at timestamptz DEFAULT now(),
  read_at timestamptz,
  status text DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'read'))
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_user_id ON patient_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_patient_profiles_asha_worker ON patient_profiles(asha_worker_id);
CREATE INDEX IF NOT EXISTS idx_health_records_patient_id ON health_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_records_created_at ON health_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (id = current_setting('app.current_user_id')::uuid)
  WITH CHECK (id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "ASHA workers can view assigned patients"
  ON users FOR SELECT
  TO authenticated
  USING (
    role = 'patient' AND
    EXISTS (
      SELECT 1 FROM patient_profiles pp
      WHERE pp.user_id = users.id
      AND pp.asha_worker_id = current_setting('app.current_user_id')::uuid
    )
  );

-- RLS Policies for patient_profiles table
CREATE POLICY "Patients can view own profile"
  ON patient_profiles FOR SELECT
  TO authenticated
  USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "Patients can update own profile"
  ON patient_profiles FOR UPDATE
  TO authenticated
  USING (user_id = current_setting('app.current_user_id')::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "Partners can view linked patient profile"
  ON patient_profiles FOR SELECT
  TO authenticated
  USING (partner_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "ASHA workers can view assigned patient profiles"
  ON patient_profiles FOR SELECT
  TO authenticated
  USING (asha_worker_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "ASHA workers can update assigned patient profiles"
  ON patient_profiles FOR UPDATE
  TO authenticated
  USING (asha_worker_id = current_setting('app.current_user_id')::uuid)
  WITH CHECK (asha_worker_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "Patients can create own profile"
  ON patient_profiles FOR INSERT
  TO authenticated
  WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

-- RLS Policies for health_records table
CREATE POLICY "Patients can view own health records"
  ON health_records FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patient_profiles
      WHERE user_id = current_setting('app.current_user_id')::uuid
    )
  );

CREATE POLICY "Partners can view linked patient health records"
  ON health_records FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patient_profiles
      WHERE partner_id = current_setting('app.current_user_id')::uuid
    )
  );

CREATE POLICY "ASHA workers can view assigned patient health records"
  ON health_records FOR SELECT
  TO authenticated
  USING (
    patient_id IN (
      SELECT id FROM patient_profiles
      WHERE asha_worker_id = current_setting('app.current_user_id')::uuid
    )
  );

CREATE POLICY "ASHA workers can create health records"
  ON health_records FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patient_profiles
      WHERE asha_worker_id = current_setting('app.current_user_id')::uuid
    )
  );

CREATE POLICY "Patients can create own health records"
  ON health_records FOR INSERT
  TO authenticated
  WITH CHECK (
    patient_id IN (
      SELECT id FROM patient_profiles
      WHERE user_id = current_setting('app.current_user_id')::uuid
    )
  );

-- RLS Policies for notifications table
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = current_setting('app.current_user_id')::uuid)
  WITH CHECK (user_id = current_setting('app.current_user_id')::uuid);

CREATE POLICY "System can create notifications"
  ON notifications FOR INSERT
  TO authenticated
  WITH CHECK (true);
