
-- Migration 0038: Properly remove NOT NULL constraint from scheduled_date
-- This fixes the issue where jobs couldn't be created without a scheduled date

-- Drop the check constraint first (if it exists)
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'jobs_scheduled_date_check'
    ) THEN
        ALTER TABLE jobs DROP CONSTRAINT jobs_scheduled_date_check;
        RAISE NOTICE 'Dropped existing check constraint';
    END IF;
END $$;

-- Remove NOT NULL constraint from scheduled_date
ALTER TABLE jobs ALTER COLUMN scheduled_date DROP NOT NULL;

-- Remove NOT NULL from related time columns for consistency
ALTER TABLE jobs ALTER COLUMN scheduled_start_time DROP NOT NULL;
ALTER TABLE jobs ALTER COLUMN scheduled_end_time DROP NOT NULL;

-- Add a better check constraint that allows NULL for pending states
ALTER TABLE jobs ADD CONSTRAINT jobs_scheduled_date_check 
CHECK (
    status IN ('pending_deposit', 'draft', 'pending') 
    OR scheduled_date IS NOT NULL
);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration Complete: scheduled_date is now properly nullable';
    RAISE NOTICE 'Jobs can be created without dates in pending_deposit/draft/pending status';
    RAISE NOTICE 'scheduled_date required once job moves to scheduled/in_progress/completed';
END $$;
