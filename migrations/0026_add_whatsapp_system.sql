
-- Migration 0026: Add WhatsApp Integration System
-- This migration adds all tables and fields needed for WhatsApp messaging via Twilio

-- 1. Extend businesses table with WhatsApp configuration
DO $$ 
BEGIN
    -- WhatsApp Provider Configuration
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'whatsapp_provider'
    ) THEN
        ALTER TABLE businesses ADD COLUMN whatsapp_provider VARCHAR(50) DEFAULT 'twilio';
        RAISE NOTICE 'Added whatsapp_provider to businesses';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'whatsapp_provider_config'
    ) THEN
        ALTER TABLE businesses ADD COLUMN whatsapp_provider_config JSONB;
        RAISE NOTICE 'Added whatsapp_provider_config to businesses';
    END IF;

    -- Credit Limits
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'whatsapp_monthly_limit'
    ) THEN
        ALTER TABLE businesses ADD COLUMN whatsapp_monthly_limit INTEGER DEFAULT 1000;
        RAISE NOTICE 'Added whatsapp_monthly_limit to businesses';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'whatsapp_current_usage'
    ) THEN
        ALTER TABLE businesses ADD COLUMN whatsapp_current_usage INTEGER DEFAULT 0;
        RAISE NOTICE 'Added whatsapp_current_usage to businesses';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'whatsapp_usage_reset_date'
    ) THEN
        ALTER TABLE businesses ADD COLUMN whatsapp_usage_reset_date DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month';
        RAISE NOTICE 'Added whatsapp_usage_reset_date to businesses';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'whatsapp_limit_alert_sent'
    ) THEN
        ALTER TABLE businesses ADD COLUMN whatsapp_limit_alert_sent BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added whatsapp_limit_alert_sent to businesses';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'whatsapp_overage_allowed'
    ) THEN
        ALTER TABLE businesses ADD COLUMN whatsapp_overage_allowed BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added whatsapp_overage_allowed to businesses';
    END IF;
END $$;

-- 2. Extend contacts table with WhatsApp opt-in tracking
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' AND column_name = 'whatsapp_opt_in_date'
    ) THEN
        ALTER TABLE contacts ADD COLUMN whatsapp_opt_in_date TIMESTAMP;
        RAISE NOTICE 'Added whatsapp_opt_in_date to contacts';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' AND column_name = 'whatsapp_opt_out_date'
    ) THEN
        ALTER TABLE contacts ADD COLUMN whatsapp_opt_out_date TIMESTAMP;
        RAISE NOTICE 'Added whatsapp_opt_out_date to contacts';
    END IF;
END $$;

-- 3. Create whatsapp_queue table (Provider-agnostic design)
CREATE TABLE IF NOT EXISTS whatsapp_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
    
    -- Message Details
    to_number VARCHAR(50) NOT NULL,
    template_name VARCHAR(100),
    template_params JSONB,
    message_body TEXT,
    media_url TEXT,
    
    -- PROVIDER-AGNOSTIC FIELDS (works for Twilio OR Meta)
    provider_name VARCHAR(50) DEFAULT 'twilio',
    provider_message_id VARCHAR(150), -- Twilio: SM... | Meta: wamid.HBg...
    
    -- Status Tracking
    status VARCHAR(20) DEFAULT 'pending',
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    
    -- Timestamps
    sent_at TIMESTAMP,
    delivered_at TIMESTAMP,
    read_at TIMESTAMP,
    failed_at TIMESTAMP,
    
    -- Cost Tracking (configurable per provider)
    cost DECIMAL(10,4) DEFAULT 0.40, -- R0.40 for Twilio, R0.25 for Meta
    usage_period DATE DEFAULT DATE_TRUNC('month', CURRENT_DATE),
    
    -- Polymorphic Relationship
    related_type VARCHAR(50),
    related_id UUID,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for whatsapp_queue
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_business ON whatsapp_queue(business_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_status ON whatsapp_queue(status);
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_provider_msg ON whatsapp_queue(provider_message_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_queue_usage_period ON whatsapp_queue(business_id, usage_period);

-- 4. Create whatsapp_templates table
CREATE TABLE IF NOT EXISTS whatsapp_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    template_name VARCHAR(100) NOT NULL,
    template_type VARCHAR(50) NOT NULL,
    
    -- PROVIDER-AGNOSTIC (store both IDs)
    twilio_template_sid VARCHAR(100),  -- For Twilio
    meta_template_id VARCHAR(100),     -- For Meta (future)
    
    content_text TEXT NOT NULL,
    variables JSONB,
    language VARCHAR(10) DEFAULT 'en',
    category VARCHAR(50) DEFAULT 'utility',
    
    -- Approval Status (Meta approves regardless of provider)
    status VARCHAR(20) DEFAULT 'pending',
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(business_id, template_name)
);

-- Create indexes for whatsapp_templates
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_business ON whatsapp_templates(business_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_templates_status ON whatsapp_templates(status);

-- 5. Create usage_tracking table (Multi-Service)
CREATE TABLE IF NOT EXISTS usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    -- Service Details
    service_type VARCHAR(50) NOT NULL, -- 'whatsapp', 'sms', 'ai_credits'
    provider_name VARCHAR(50),         -- 'twilio', 'meta', 'gemini'
    
    -- Period Tracking
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Usage Metrics
    usage_count INTEGER DEFAULT 0,
    usage_limit INTEGER NOT NULL,
    
    -- Cost Tracking
    cost_per_unit DECIMAL(10,4),
    total_cost DECIMAL(10,2) DEFAULT 0,
    
    status VARCHAR(20) DEFAULT 'active',
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(business_id, service_type, period_start)
);

-- Create indexes for usage_tracking
CREATE INDEX IF NOT EXISTS idx_usage_tracking_business ON usage_tracking(business_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_period ON usage_tracking(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_status ON usage_tracking(status);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_service ON usage_tracking(business_id, service_type);

-- 6. Create usage_alerts table
CREATE TABLE IF NOT EXISTS usage_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    
    service_type VARCHAR(50) NOT NULL,
    threshold_percentage INTEGER NOT NULL, -- 80, 90, 100
    alert_type VARCHAR(50) NOT NULL,       -- 'email', 'dashboard', 'block_service'
    
    triggered_at TIMESTAMP,
    acknowledged_at TIMESTAMP,
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_message TEXT,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for usage_alerts
CREATE INDEX IF NOT EXISTS idx_usage_alerts_business ON usage_alerts(business_id);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_service ON usage_alerts(service_type);
CREATE INDEX IF NOT EXISTS idx_usage_alerts_triggered ON usage_alerts(business_id, triggered_at);

-- Add comments for documentation
COMMENT ON TABLE whatsapp_queue IS 'Queue for outbound WhatsApp messages (provider-agnostic)';
COMMENT ON TABLE whatsapp_templates IS 'WhatsApp message templates (supports Twilio and Meta)';
COMMENT ON TABLE usage_tracking IS 'Multi-service usage tracking (WhatsApp, SMS, AI credits)';
COMMENT ON TABLE usage_alerts IS 'Usage threshold alerts for all services';

COMMENT ON COLUMN businesses.whatsapp_provider IS 'Current WhatsApp provider: twilio or meta';
COMMENT ON COLUMN businesses.whatsapp_provider_config IS 'JSON config for provider credentials';
COMMENT ON COLUMN businesses.whatsapp_monthly_limit IS 'Maximum WhatsApp messages per month';
COMMENT ON COLUMN businesses.whatsapp_current_usage IS 'Current month WhatsApp message count';

COMMENT ON COLUMN whatsapp_queue.provider_name IS 'Message provider: twilio or meta';
COMMENT ON COLUMN whatsapp_queue.provider_message_id IS 'Provider-specific message ID (Twilio SM... or Meta wamid...)';

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ WhatsApp Integration Schema Migration Complete';
    RAISE NOTICE 'Tables created: whatsapp_queue, whatsapp_templates, usage_tracking, usage_alerts';
    RAISE NOTICE 'Businesses table extended with 7 WhatsApp fields';
    RAISE NOTICE 'Contacts table extended with 2 WhatsApp opt-in fields';
END $$;
