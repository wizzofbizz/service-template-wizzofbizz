
-- Add availability settings for calendar booking (Phase 19C)
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS quote_visit_duration_minutes INTEGER DEFAULT 60,
ADD COLUMN IF NOT EXISTS buffer_between_visits_minutes INTEGER DEFAULT 15;

-- Add booking-related fields to jobs table (if not already added by 0018)
-- These support the calendar booking feature
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'is_quote_visit'
  ) THEN
    ALTER TABLE jobs ADD COLUMN is_quote_visit BOOLEAN DEFAULT FALSE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'related_quote_id'
  ) THEN
    ALTER TABLE jobs ADD COLUMN related_quote_id UUID REFERENCES quotes(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'customer_name'
  ) THEN
    ALTER TABLE jobs ADD COLUMN customer_name VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'customer_email'
  ) THEN
    ALTER TABLE jobs ADD COLUMN customer_email VARCHAR(255);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name = 'customer_phone'
  ) THEN
    ALTER TABLE jobs ADD COLUMN customer_phone VARCHAR(50);
  END IF;
END $$;
