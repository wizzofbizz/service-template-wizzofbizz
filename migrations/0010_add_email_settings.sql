
-- Add email and communication settings to businesses table
DO $$ 
BEGIN
    -- Add sender_email if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'sender_email'
    ) THEN
        ALTER TABLE businesses ADD COLUMN sender_email VARCHAR(255);
        RAISE NOTICE 'Added sender_email column';
    END IF;

    -- Add sender_name if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'sender_name'
    ) THEN
        ALTER TABLE businesses ADD COLUMN sender_name VARCHAR(255);
        RAISE NOTICE 'Added sender_name column';
    END IF;

    -- Add sender_email_verified if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'sender_email_verified'
    ) THEN
        ALTER TABLE businesses ADD COLUMN sender_email_verified BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added sender_email_verified column';
    END IF;

    -- Add business_whatsapp if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'business_whatsapp'
    ) THEN
        ALTER TABLE businesses ADD COLUMN business_whatsapp VARCHAR(50);
        RAISE NOTICE 'Added business_whatsapp column';
    END IF;

    -- Add whatsapp_enabled if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'whatsapp_enabled'
    ) THEN
        ALTER TABLE businesses ADD COLUMN whatsapp_enabled BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added whatsapp_enabled column';
    END IF;

    -- Add quote_followup_days if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'quote_followup_days'
    ) THEN
        ALTER TABLE businesses ADD COLUMN quote_followup_days INTEGER DEFAULT 3;
        RAISE NOTICE 'Added quote_followup_days column';
    END IF;

    -- Add job_reminder_days if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'job_reminder_days'
    ) THEN
        ALTER TABLE businesses ADD COLUMN job_reminder_days JSONB DEFAULT '[1, 3, 7]';
        RAISE NOTICE 'Added job_reminder_days column';
    END IF;
END $$;

-- Create email_action_tokens table if it doesn't exist
CREATE TABLE IF NOT EXISTS email_action_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_email_tokens_token'
    ) THEN
        CREATE INDEX idx_email_tokens_token ON email_action_tokens(token);
        RAISE NOTICE 'Created idx_email_tokens_token index';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE indexname = 'idx_email_tokens_expiry'
    ) THEN
        CREATE INDEX idx_email_tokens_expiry ON email_action_tokens(expires_at);
        RAISE NOTICE 'Created idx_email_tokens_expiry index';
    END IF;
END $$;
