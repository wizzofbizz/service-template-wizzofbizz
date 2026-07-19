
-- Add service_type column to jobs table with proper error handling
DO $$ 
BEGIN
  -- Drop the column if it exists (cleanup)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'service_type'
  ) THEN
    ALTER TABLE jobs DROP COLUMN service_type;
    RAISE NOTICE 'Dropped existing service_type column';
  END IF;

  -- Add the column fresh
  ALTER TABLE jobs ADD COLUMN service_type VARCHAR(50);
  RAISE NOTICE 'Added service_type column to jobs table';

  -- Add index for better query performance
  CREATE INDEX IF NOT EXISTS idx_jobs_service_type ON jobs(service_type);
  RAISE NOTICE 'Created index on service_type';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error: %', SQLERRM;
    RAISE;
END $$;
