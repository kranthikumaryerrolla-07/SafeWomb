/*
  # Add ML Model Fields to Health Records

  1. Changes
    - Add age column to health_records
    - Add bmi column for Body Mass Index
    - Add gestational_week for pregnancy week tracking
    - Add kick_count for fetal movement monitoring
    - Add previous_complications flag
    - Add rh_factor for blood type
    - Add pregnancy_order for tracking pregnancy number

  2. Notes
    - All fields aligned with maternal_risk_model.pkl requirements
    - Medical ranges will be validated in application layer
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_records' AND column_name = 'age'
  ) THEN
    ALTER TABLE health_records ADD COLUMN age integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_records' AND column_name = 'bmi'
  ) THEN
    ALTER TABLE health_records ADD COLUMN bmi decimal(5, 2);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_records' AND column_name = 'gestational_week'
  ) THEN
    ALTER TABLE health_records ADD COLUMN gestational_week integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_records' AND column_name = 'kick_count'
  ) THEN
    ALTER TABLE health_records ADD COLUMN kick_count integer;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_records' AND column_name = 'previous_complications'
  ) THEN
    ALTER TABLE health_records ADD COLUMN previous_complications integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_records' AND column_name = 'rh_factor'
  ) THEN
    ALTER TABLE health_records ADD COLUMN rh_factor integer DEFAULT 1;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'health_records' AND column_name = 'pregnancy_order'
  ) THEN
    ALTER TABLE health_records ADD COLUMN pregnancy_order integer DEFAULT 1;
  END IF;
END $$;