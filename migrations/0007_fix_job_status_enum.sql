
-- Fix job_status enum to include draft
-- This migration ensures the job_status enum has all required values

DO $$
BEGIN
  -- Add 'draft' to job_status enum if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'draft' 
    AND enumtypid = 'job_status'::regtype
  ) THEN
    ALTER TYPE job_status ADD VALUE 'draft' BEFORE 'scheduled';
    RAISE NOTICE 'Added draft to job_status enum';
  ELSE
    RAISE NOTICE 'draft already exists in job_status enum';
  END IF;
END $$;
