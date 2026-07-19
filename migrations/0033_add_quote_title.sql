
-- Add title column to quotes table
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS title VARCHAR(255);
