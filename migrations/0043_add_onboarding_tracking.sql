
-- Migration: Add onboarding completion tracking
-- Purpose: Track onboarding wizard progress and completion status
-- Date: 2025-01-19

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS onboarding_complete BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN businesses.onboarding_step IS 'Last completed onboarding step (0-6)';
COMMENT ON COLUMN businesses.onboarding_complete IS 'Whether the full onboarding wizard has been completed';

-- Create index for faster lookups of incomplete onboarding
CREATE INDEX IF NOT EXISTS idx_businesses_onboarding_incomplete 
ON businesses(onboarding_complete) 
WHERE onboarding_complete = false;
