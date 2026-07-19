
-- Add service_questions column to services table
DO $$ BEGIN
  ALTER TABLE services ADD COLUMN IF NOT EXISTS service_questions JSONB DEFAULT '[]'::jsonb;
END $$;
