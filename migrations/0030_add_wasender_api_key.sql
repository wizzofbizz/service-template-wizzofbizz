
-- Migration 0030: Add WaSender API Key
-- Adds support for storing WaSender API credentials alongside Twilio

DO $$ 
BEGIN
    -- Add WaSender API Key field
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'whatsapp_wasender_api_key'
    ) THEN
        ALTER TABLE businesses ADD COLUMN whatsapp_wasender_api_key VARCHAR(255);
        RAISE NOTICE 'Added whatsapp_wasender_api_key to businesses';
    END IF;
END $$;

COMMENT ON COLUMN businesses.whatsapp_wasender_api_key IS 'WaSender API key for WhatsApp integration (store securely)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ WaSender API Key Migration Complete';
    RAISE NOTICE 'Added whatsapp_wasender_api_key field to businesses table';
END $$;
