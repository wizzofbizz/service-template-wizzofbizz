
-- Phase 19A: AI Quote Generation System (Safe Re-application)
-- Adds missing columns with error handling for existing columns

DO $$ 
BEGIN
  -- 1. Extend services table with AI pricing rules
  ALTER TABLE services ADD COLUMN IF NOT EXISTS pricing_formula TEXT;
  ALTER TABLE services ADD COLUMN IF NOT EXISTS ai_guidance_prompt TEXT;
  ALTER TABLE services ADD COLUMN IF NOT EXISTS rule_config JSONB DEFAULT '{}'::jsonb;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ 
BEGIN
  -- 2. Extend contacts table with communication preferences
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS preferred_channel VARCHAR(20) DEFAULT 'email';
  ALTER TABLE contacts ADD COLUMN IF NOT EXISTS whatsapp_opt_in BOOLEAN DEFAULT false;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ 
BEGIN
  -- 3. Add latest_version_id to quotes table
  ALTER TABLE quotes ADD COLUMN IF NOT EXISTS latest_version_id UUID;
  ALTER TABLE quotes ADD COLUMN IF NOT EXISTS declined_at TIMESTAMP;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- 4. Create quote_versions table (version tracking system)
CREATE TABLE IF NOT EXISTS quote_versions (
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

-- 5. Create ai_quote_learning_events table (ML training data)
CREATE TABLE IF NOT EXISTS ai_quote_learning_events (
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

-- 6. Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_quote_versions_quote_id ON quote_versions(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_versions_source ON quote_versions(source);
CREATE INDEX IF NOT EXISTS idx_ai_learning_business_id ON ai_quote_learning_events(business_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_quote_id ON ai_quote_learning_events(quote_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_created_at ON ai_quote_learning_events(created_at);

-- 7. Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'quotes_latest_version_id_fkey'
  ) THEN
    ALTER TABLE quotes ADD CONSTRAINT quotes_latest_version_id_fkey 
      FOREIGN KEY (latest_version_id) REFERENCES quote_versions(id);
  END IF;
END $$;

-- 8. Add check constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_confidence_range'
  ) THEN
    ALTER TABLE quote_versions ADD CONSTRAINT check_confidence_range 
      CHECK (ai_confidence_score IS NULL OR (ai_confidence_score >= 0 AND ai_confidence_score <= 1));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_preferred_channel'
  ) THEN
    ALTER TABLE contacts ADD CONSTRAINT check_preferred_channel 
      CHECK (preferred_channel IN ('email', 'whatsapp'));
  END IF;
END $$;
