-- Add subscription_plan_id column to businesses table
-- This migration adds the missing column that caused the GBP connection error

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS subscription_plan_id TEXT DEFAULT 'monthly';

-- Add trial tracking fields
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_start_date TIMESTAMP;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_end_date TIMESTAMP;

-- Add feature usage tracking
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS feature_usage JSONB DEFAULT '{}'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN businesses.subscription_plan_id IS 'Current active subscription plan';
COMMENT ON COLUMN businesses.trial_start_date IS 'When trial period started (if applicable)';
COMMENT ON COLUMN businesses.trial_end_date IS 'When trial period ends (if applicable)';
COMMENT ON COLUMN businesses.feature_usage IS 'Monthly usage counters: {"contacts_created": 45, "jobs_created": 12}';