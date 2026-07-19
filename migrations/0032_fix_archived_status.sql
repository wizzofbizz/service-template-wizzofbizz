
-- Fix archived status in quote_status enum
-- This migration ensures 'archived' is added to the enum if it doesn't exist

DO $$ 
BEGIN
  -- Check if 'archived' value exists in the enum
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumlabel = 'archived' 
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'quote_status')
  ) THEN
    -- Add 'archived' to the enum
    ALTER TYPE quote_status ADD VALUE 'archived';
    RAISE NOTICE 'Added archived to quote_status enum';
  ELSE
    RAISE NOTICE 'archived already exists in quote_status enum';
  END IF;
END $$;
