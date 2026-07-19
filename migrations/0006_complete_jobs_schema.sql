
-- Complete Jobs Schema Fix Migration
-- This migration ensures all required columns and tables exist

-- Step 1: Add missing columns to jobs table (all with IF NOT EXISTS to be safe)
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2);
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2);

-- Step 2: Create job_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  line_total DECIMAL(10, 2) NOT NULL,
  display_order INTEGER DEFAULT 0
);

-- Step 3: Create index for faster lookups (only if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_job_items_job_id ON job_items(job_id);

-- Step 4: Verify the changes
DO $$
BEGIN
  -- Check if job_items table exists
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'job_items') THEN
    RAISE NOTICE 'job_items table exists';
  ELSE
    RAISE EXCEPTION 'job_items table was not created';
  END IF;

  -- Check if required columns exist in jobs table
  IF EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_name = 'jobs' AND column_name IN ('subtotal', 'tax_amount', 'discount_amount', 'total_amount', 'cancellation_reason')
  ) THEN
    RAISE NOTICE 'All required columns exist in jobs table';
  ELSE
    RAISE WARNING 'Some columns may be missing from jobs table';
  END IF;
END $$;
