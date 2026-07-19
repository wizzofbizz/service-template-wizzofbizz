
-- Migration 0031: Add missing whatsapp_provider column
-- This field was defined in schema but never migrated to database

DO $$ 
BEGIN
    -- Add whatsapp_provider field
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'whatsapp_provider'
    ) THEN
        ALTER TABLE businesses ADD COLUMN whatsapp_provider VARCHAR(50) DEFAULT 'twilio';
        RAISE NOTICE 'Added whatsapp_provider to businesses';
    END IF;
END $$;

COMMENT ON COLUMN businesses.whatsapp_provider IS 'WhatsApp provider selection: twilio or wasender';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ WhatsApp Provider Migration Complete';
    RAISE NOTICE 'Added whatsapp_provider field to businesses table';
END $$;
