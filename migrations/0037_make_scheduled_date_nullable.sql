
-- Migration 0037: Make scheduled_date nullable to support deposit flow
-- This allows jobs to be created without a scheduled date when quotes are accepted,
-- requiring customers to book an appointment after accepting (and paying deposit if required)

DO $$ 
BEGIN
    -- Make scheduled_date nullable
    ALTER TABLE jobs ALTER COLUMN scheduled_date DROP NOT NULL;
    RAISE NOTICE 'Made scheduled_date nullable in jobs table';
END $$;

-- Add check constraint to ensure scheduled_date is set when job is not in pending states
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'jobs_scheduled_date_check'
    ) THEN
        ALTER TABLE jobs ADD CONSTRAINT jobs_scheduled_date_check 
        CHECK (
            status IN ('pending_deposit', 'draft') OR scheduled_date IS NOT NULL
        );
        RAISE NOTICE 'Added constraint: scheduled_date required when not pending';
    END IF;
END $$;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Migration Complete: scheduled_date is now nullable';
    RAISE NOTICE 'Jobs can be created without dates in pending_deposit/draft status';
    RAISE NOTICE 'scheduled_date required once job moves to scheduled/in_progress/completed';
END $$;
