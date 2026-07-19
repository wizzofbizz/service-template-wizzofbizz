
-- Migration 0034: Add title column to invoices table
-- This field allows invoices to have descriptive titles pulled from associated jobs

DO $$ 
BEGIN
    -- Add title field to invoices
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'title'
    ) THEN
        ALTER TABLE invoices ADD COLUMN title VARCHAR(255);
        RAISE NOTICE 'Added title to invoices table';
    ELSE
        RAISE NOTICE 'title column already exists in invoices table';
    END IF;
END $$;

COMMENT ON COLUMN invoices.title IS 'Descriptive title for the invoice, typically pulled from the associated job';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Invoice Title Migration Complete';
    RAISE NOTICE 'Added title field to invoices table';
END $$;
