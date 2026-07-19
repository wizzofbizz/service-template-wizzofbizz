
-- Migration: Add GBP Review URL field to businesses table
-- This allows businesses to store their Google Business Profile review link

ALTER TABLE businesses ADD COLUMN IF NOT EXISTS gbp_review_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN businesses.gbp_review_url IS 'Google Business Profile review URL (e.g., https://g.page/r/CQZod46Ql6toEAE/review)';
