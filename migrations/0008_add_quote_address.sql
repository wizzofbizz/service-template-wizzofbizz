
-- Add location_address column to quotes table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotes' AND column_name = 'location_address'
    ) THEN
        ALTER TABLE quotes ADD COLUMN location_address TEXT;
        RAISE NOTICE 'Added location_address column to quotes table';
    ELSE
        RAISE NOTICE 'location_address column already exists in quotes table';
    END IF;
END $$;
