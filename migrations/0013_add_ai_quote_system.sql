
-- Phase 19A: AI Quote Generation System
-- Extends existing tables and adds new tables for AI-powered quoting

-- 1. Extend services table with AI pricing rules
ALTER TABLE services 
ADD COLUMN pricing_formula TEXT,
ADD COLUMN ai_guidance_prompt TEXT,
ADD COLUMN rule_config JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN services.pricing_formula IS 'Formula string like "base_price + (hours * 600) + (km * 15)"';
COMMENT ON COLUMN services.ai_guidance_prompt IS 'Instructions for AI to interpret customer requests';
COMMENT ON COLUMN services.rule_config IS 'Flexible pricing variables like {"hourly_rate": 600, "travel_rate": 15}';

-- 2. Extend contacts table with communication preferences
ALTER TABLE contacts
ADD COLUMN preferred_channel VARCHAR(20) DEFAULT 'email',
ADD COLUMN whatsapp_opt_in BOOLEAN DEFAULT false;

COMMENT ON COLUMN contacts.preferred_channel IS 'Customer preferred contact method: email or whatsapp';
COMMENT ON COLUMN contacts.whatsapp_opt_in IS 'Customer consent for WhatsApp communications';

-- 3. Create quote_versions table (version tracking system)
CREATE TABLE quote_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  source VARCHAR(20) NOT NULL CHECK (source IN ('ai', 'manual', 'site_visit')),
  
  -- Snapshot of quote data at this version
  subtotal DECIMAL(10, 2) NOT NULL,
  tax_amount DECIMAL(10, 2) DEFAULT 0,
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  line_items JSONB NOT NULL,
  notes TEXT,
  
  -- AI-specific fields
  ai_extracted_features JSONB,
  ai_confidence_score DECIMAL(3, 2),
  ai_reasoning TEXT,
  
  -- Metadata
  created_by VARCHAR REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE(quote_id, version_number)
);

CREATE INDEX idx_quote_versions_quote_id ON quote_versions(quote_id);
CREATE INDEX idx_quote_versions_source ON quote_versions(source);

COMMENT ON TABLE quote_versions IS 'Immutable snapshots of quote changes for AI learning';
COMMENT ON COLUMN quote_versions.source IS 'Origin of this version: ai, manual, or site_visit';
COMMENT ON COLUMN quote_versions.ai_extracted_features IS 'Features AI identified from customer input';
COMMENT ON COLUMN quote_versions.ai_confidence_score IS 'AI confidence in this quote (0.00 to 1.00)';

-- 4. Add latest_version_id to quotes table
ALTER TABLE quotes
ADD COLUMN latest_version_id UUID REFERENCES quote_versions(id);

COMMENT ON COLUMN quotes.latest_version_id IS 'Points to current version in quote_versions table';

-- 5. Create ai_quote_learning_events table (ML training data)
CREATE TABLE ai_quote_learning_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  quote_id UUID NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  
  -- AI prediction vs reality
  ai_version_id UUID REFERENCES quote_versions(id),
  final_version_id UUID REFERENCES quote_versions(id),
  
  -- Error metrics
  price_difference DECIMAL(10, 2),
  price_difference_percent DECIMAL(5, 2),
  feature_extraction_errors JSONB,
  
  -- Improvement tracking
  feedback_category VARCHAR(50),
  corrections_applied JSONB,
  
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ai_learning_business_id ON ai_quote_learning_events(business_id);
CREATE INDEX idx_ai_learning_quote_id ON ai_quote_learning_events(quote_id);
CREATE INDEX idx_ai_learning_created_at ON ai_quote_learning_events(created_at);

COMMENT ON TABLE ai_quote_learning_events IS 'Training data comparing AI predictions to final accepted quotes';
COMMENT ON COLUMN ai_quote_learning_events.price_difference IS 'Absolute difference between AI and final price';
COMMENT ON COLUMN ai_quote_learning_events.feature_extraction_errors IS 'Which features AI misidentified';

-- 6. Add constraints
ALTER TABLE quote_versions
ADD CONSTRAINT check_confidence_range CHECK (ai_confidence_score IS NULL OR (ai_confidence_score >= 0 AND ai_confidence_score <= 1));

ALTER TABLE contacts
ADD CONSTRAINT check_preferred_channel CHECK (preferred_channel IN ('email', 'whatsapp'));
