
-- Add decline_reason column to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS decline_reason TEXT;
