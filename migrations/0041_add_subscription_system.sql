
-- =====================================================
-- SUBSCRIPTION SYSTEM MIGRATION
-- =====================================================
-- Purpose: Add subscription and payment infrastructure
-- Tables: subscription_plans, user_subscriptions, payment_history, 
--         discount_codes, discount_code_usage, admin_settings
-- =====================================================

-- 1. SUBSCRIPTION PLANS TABLE
-- Stores available subscription tiers (Free, Monthly, Annual)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  monthly_price TEXT NOT NULL,
  annual_price TEXT,
  trial_days INTEGER DEFAULT 0,
  features JSONB NOT NULL DEFAULT '{}',
  limits JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE subscription_plans IS 'Available subscription tiers and their features';
COMMENT ON COLUMN subscription_plans.features IS 'JSON object of feature flags: {"whatsapp": true, "ai_quotes": false}';
COMMENT ON COLUMN subscription_plans.limits IS 'JSON object of usage limits: {"contacts": 100, "jobs": 50}';

-- 2. USER SUBSCRIPTIONS TABLE
-- Tracks active subscriptions per business
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  plan_id TEXT NOT NULL REFERENCES subscription_plans(id),
  status TEXT NOT NULL DEFAULT 'active',
  billing_cycle TEXT NOT NULL DEFAULT 'monthly',
  current_period_start TIMESTAMP NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMP NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  cancelled_at TIMESTAMP,
  payfast_token TEXT UNIQUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_subscriptions_business ON user_subscriptions(business_id);
CREATE INDEX idx_user_subscriptions_plan ON user_subscriptions(plan_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);

COMMENT ON TABLE user_subscriptions IS 'Active subscriptions per business with PayFast integration';
COMMENT ON COLUMN user_subscriptions.payfast_token IS 'PayFast subscription token for recurring payments';

-- 3. PAYMENT HISTORY TABLE
-- Audit trail of all transactions
CREATE TABLE IF NOT EXISTS payment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  amount TEXT NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  payment_method TEXT DEFAULT 'payfast',
  transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payment_history_business ON payment_history(business_id);
CREATE INDEX idx_payment_history_subscription ON payment_history(subscription_id);
CREATE INDEX idx_payment_history_status ON payment_history(status);

COMMENT ON TABLE payment_history IS 'Complete audit trail of all payment transactions';
COMMENT ON COLUMN payment_history.metadata IS 'PayFast ITN data and other payment details';

-- 4. DISCOUNT CODES TABLE
-- Promotional codes management
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  discount_type TEXT NOT NULL,
  discount_value TEXT NOT NULL,
  max_uses INTEGER,
  times_used INTEGER DEFAULT 0,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE discount_codes IS 'Promotional discount codes for subscriptions';
COMMENT ON COLUMN discount_codes.discount_type IS 'Either "percentage" or "fixed_amount"';

-- 5. DISCOUNT CODE USAGE TABLE
-- Track discount redemptions
CREATE TABLE IF NOT EXISTS discount_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id),
  original_amount TEXT NOT NULL,
  discount_amount TEXT NOT NULL,
  final_amount TEXT NOT NULL,
  used_at TIMESTAMP DEFAULT NOW()
);

-- 6. ADMIN SETTINGS TABLE
-- Global feature toggles and limits
CREATE TABLE IF NOT EXISTS admin_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  setting_type TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE admin_settings IS 'Global feature toggles and configurable limits for testing';

-- =====================================================
-- SEED DEFAULT SUBSCRIPTION PLANS
-- =====================================================

INSERT INTO subscription_plans (id, name, display_name, description, monthly_price, annual_price, trial_days, features, limits, is_active, display_order)
VALUES 
  (
    'monthly',
    'Monthly Plan',
    'Monthly (R350/month)',
    'Full access with monthly billing',
    'R350',
    NULL,
    0,
    '{"jobs": true, "quotes": true, "calendar": true, "contacts": true, "invoices": true, "services": true, "testimonials": true, "whatsapp": true, "email": true, "ai_quotes": true, "analytics": true, "website_editor": true, "custom_domain": true}'::jsonb,
    '{"jobs": -1, "quotes": -1, "contacts": -1, "invoices": -1, "services": -1}'::jsonb,
    true,
    1
  ),
  (
    'annual',
    'Annual Plan',
    'Annual (R3000/year - Save R1200)',
    'Full access with annual billing - best value!',
    'R350',
    'R3000',
    0,
    '{"jobs": true, "quotes": true, "calendar": true, "contacts": true, "invoices": true, "services": true, "testimonials": true, "whatsapp": true, "email": true, "ai_quotes": true, "analytics": true, "website_editor": true, "custom_domain": true}'::jsonb,
    '{"jobs": -1, "quotes": -1, "contacts": -1, "invoices": -1, "services": -1}'::jsonb,
    true,
    2
  )
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- EXTEND BUSINESSES TABLE
-- =====================================================

DO $$
BEGIN
  -- Add subscription plan reference (after plans are seeded)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'subscription_plan_id') THEN
    ALTER TABLE businesses ADD COLUMN subscription_plan_id TEXT REFERENCES subscription_plans(id) DEFAULT 'monthly';
  END IF;

  -- Add trial tracking fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'trial_start_date') THEN
    ALTER TABLE businesses ADD COLUMN trial_start_date TIMESTAMP;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'trial_end_date') THEN
    ALTER TABLE businesses ADD COLUMN trial_end_date TIMESTAMP;
  END IF;

  -- Add feature usage tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'businesses' AND column_name = 'feature_usage') THEN
    ALTER TABLE businesses ADD COLUMN feature_usage JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

COMMENT ON COLUMN businesses.subscription_plan_id IS 'Current active subscription plan';
COMMENT ON COLUMN businesses.trial_start_date IS 'When trial period started (if applicable)';
COMMENT ON COLUMN businesses.trial_end_date IS 'When trial period ends (if applicable)';
COMMENT ON COLUMN businesses.feature_usage IS 'Monthly usage counters: {"contacts_created": 45, "jobs_created": 12}';

-- =====================================================
-- SEED ADMIN SETTINGS (ALL FEATURES ENABLED)
-- =====================================================

INSERT INTO admin_settings (setting_key, setting_value, setting_type, description)
VALUES
  -- Feature toggles (all enabled for testing)
  ('feature_whatsapp_enabled', 'true', 'boolean', 'Enable WhatsApp messaging globally'),
  ('feature_ai_quotes_enabled', 'true', 'boolean', 'Enable AI-powered quote generation'),
  ('feature_calendar_enabled', 'true', 'boolean', 'Enable calendar booking system'),
  ('feature_custom_domain_enabled', 'true', 'boolean', 'Enable custom domain mapping'),
  ('feature_analytics_enabled', 'true', 'boolean', 'Enable analytics dashboard'),
  ('feature_email_enabled', 'true', 'boolean', 'Enable email notifications'),
  
  -- Usage limits (set to unlimited for testing)
  ('limit_contacts_free', '-1', 'number', 'Max contacts for free plan (-1 = unlimited)'),
  ('limit_jobs_free', '-1', 'number', 'Max jobs for free plan (-1 = unlimited)'),
  ('limit_quotes_free', '-1', 'number', 'Max quotes for free plan (-1 = unlimited)'),
  ('limit_invoices_free', '-1', 'number', 'Max invoices for free plan (-1 = unlimited)'),
  
  ('limit_contacts_monthly', '-1', 'number', 'Max contacts for monthly plan (-1 = unlimited)'),
  ('limit_jobs_monthly', '-1', 'number', 'Max jobs for monthly plan (-1 = unlimited)'),
  ('limit_quotes_monthly', '-1', 'number', 'Max quotes for monthly plan (-1 = unlimited)'),
  ('limit_invoices_monthly', '-1', 'number', 'Max invoices for monthly plan (-1 = unlimited)'),
  
  ('limit_contacts_annual', '-1', 'number', 'Max contacts for annual plan (-1 = unlimited)'),
  ('limit_jobs_annual', '-1', 'number', 'Max jobs for annual plan (-1 = unlimited)'),
  ('limit_quotes_annual', '-1', 'number', 'Max quotes for annual plan (-1 = unlimited)'),
  ('limit_invoices_annual', '-1', 'number', 'Max invoices for annual plan (-1 = unlimited)'),
  
  -- PayFast configuration
  ('payfast_mode', 'sandbox', 'string', 'PayFast environment: sandbox or production'),
  ('payfast_merchant_id', '10040400', 'string', 'PayFast merchant ID (sandbox default)')
ON CONFLICT (setting_key) DO NOTHING;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Subscription System Migration Complete';
  RAISE NOTICE 'Tables created: subscription_plans, user_subscriptions, payment_history, discount_codes, discount_code_usage, admin_settings';
  RAISE NOTICE 'Businesses table extended with 4 subscription fields';
  RAISE NOTICE 'Seeded 2 default plans: monthly, annual';
  RAISE NOTICE 'Seeded 20 admin settings for feature toggles and limits';
END $$;
