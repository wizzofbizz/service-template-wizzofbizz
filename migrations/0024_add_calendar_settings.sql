
-- Add calendar booking settings to businesses table

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS booking_window_days INTEGER DEFAULT 14,
ADD COLUMN IF NOT EXISTS minimum_notice_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS time_slot_interval_minutes INTEGER DEFAULT 15;

COMMENT ON COLUMN businesses.booking_window_days IS 'How many days in advance customers can book';
COMMENT ON COLUMN businesses.minimum_notice_hours IS 'Minimum hours notice required before booking';
COMMENT ON COLUMN businesses.time_slot_interval_minutes IS 'Time slot intervals for availability (e.g., 15, 30, 60 minutes)';

-- Add requires_site_visit to services table
ALTER TABLE services
ADD COLUMN IF NOT EXISTS requires_site_visit BOOLEAN DEFAULT true;

COMMENT ON COLUMN services.requires_site_visit IS 'Whether this service requires a mandatory site visit before booking';
-- Phase 19C: Add calendar booking settings to businesses table
-- These columns were missing from the database schema

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS booking_window_days INTEGER DEFAULT 14,
ADD COLUMN IF NOT EXISTS minimum_notice_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS time_slot_interval_minutes INTEGER DEFAULT 15;

COMMENT ON COLUMN businesses.booking_window_days IS 'How many days in advance customers can book';
COMMENT ON COLUMN businesses.minimum_notice_hours IS 'Minimum hours notice required before booking';
COMMENT ON COLUMN businesses.time_slot_interval_minutes IS 'Time slot intervals for availability (e.g., 15, 30, 60 minutes)';

-- Also add to services table if not already present
ALTER TABLE services
ADD COLUMN IF NOT EXISTS requires_site_visit BOOLEAN DEFAULT true;

COMMENT ON COLUMN services.requires_site_visit IS 'Whether this service requires a mandatory site visit before booking';
