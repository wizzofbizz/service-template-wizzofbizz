
-- Add missing calendar booking fields that were supposed to exist
DO $$ 
BEGIN
  -- Add booking_window_days if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'booking_window_days'
  ) THEN
    ALTER TABLE businesses ADD COLUMN booking_window_days INTEGER DEFAULT 14;
    RAISE NOTICE 'Added booking_window_days column';
  END IF;

  -- Add minimum_notice_hours if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'minimum_notice_hours'
  ) THEN
    ALTER TABLE businesses ADD COLUMN minimum_notice_hours INTEGER DEFAULT 24;
    RAISE NOTICE 'Added minimum_notice_hours column';
  END IF;

  -- Add time_slot_interval_minutes if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'businesses' AND column_name = 'time_slot_interval_minutes'
  ) THEN
    ALTER TABLE businesses ADD COLUMN time_slot_interval_minutes INTEGER DEFAULT 15;
    RAISE NOTICE 'Added time_slot_interval_minutes column';
  END IF;
END $$;

COMMENT ON COLUMN businesses.booking_window_days IS 'How many days in advance customers can book (1-90 days)';
COMMENT ON COLUMN businesses.minimum_notice_hours IS 'Minimum hours notice required before booking (1-168 hours)';
COMMENT ON COLUMN businesses.time_slot_interval_minutes IS 'Interval between available time slots (5-120 minutes)';
