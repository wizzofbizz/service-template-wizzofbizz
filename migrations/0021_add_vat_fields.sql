
-- Add VAT fields to businesses table (idempotent)
DO $$ 
BEGIN
    -- Add vat_number if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'vat_number'
    ) THEN
        ALTER TABLE businesses ADD COLUMN vat_number VARCHAR(50);
        RAISE NOTICE 'Added vat_number to businesses';
    ELSE
        RAISE NOTICE 'vat_number already exists in businesses';
    END IF;

    -- Add vat_rate if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'vat_rate'
    ) THEN
        ALTER TABLE businesses ADD COLUMN vat_rate DECIMAL(5, 2) DEFAULT 15.00;
        RAISE NOTICE 'Added vat_rate to businesses';
    ELSE
        RAISE NOTICE 'vat_rate already exists in businesses';
    END IF;
END $$;
