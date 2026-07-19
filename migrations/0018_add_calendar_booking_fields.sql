
-- Phase 19C: Calendar Booking - Add calendar configuration fields

DO $$ 
BEGIN
  -- Add calendar configuration fields
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS quote_visit_duration_minutes INTEGER DEFAULT 60;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS buffer_between_visits_minutes INTEGER DEFAULT 15;
  ALTER TABLE businesses ADD COLUMN IF NOT EXISTS calendar_hours JSONB DEFAULT '{
    "monday": { "start": "09:00", "end": "17:00" },
    "tuesday": { "start": "09:00", "end": "17:00" },
    "wednesday": { "start": "09:00", "end": "17:00" },
    "thursday": { "start": "09:00", "end": "17:00" },
    "friday": { "start": "09:00", "end": "17:00" },
    "saturday": null,
    "sunday": null
  }'::jsonb;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

COMMENT ON COLUMN businesses.quote_visit_duration_minutes IS 'Default duration for quote visit appointments in minutes';
COMMENT ON COLUMN businesses.buffer_between_visits_minutes IS 'Buffer time between appointments to prevent overlap';
COMMENT ON COLUMN businesses.calendar_hours IS 'Structured business hours for each day of the week';
