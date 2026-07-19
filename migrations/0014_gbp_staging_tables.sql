-- GBP Staging Tables Migration
-- Adds identity fields to google_business_profiles and creates staging tables

-- Add new enums
DO $$ BEGIN
  CREATE TYPE gbp_profile_state AS ENUM ('disconnected', 'selecting', 'staged', 'connected');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE gbp_staging_sync_status AS ENUM ('pending', 'approved', 'rejected', 'partially_approved');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add identity fields to google_business_profiles
ALTER TABLE google_business_profiles
  ADD COLUMN IF NOT EXISTS gbp_location_name varchar(500),
  ADD COLUMN IF NOT EXISTS gbp_profile_state gbp_profile_state DEFAULT 'disconnected',
  ADD COLUMN IF NOT EXISTS gbp_business_name varchar(255),
  ADD COLUMN IF NOT EXISTS gbp_phone varchar(50),
  ADD COLUMN IF NOT EXISTS gbp_email varchar(255),
  ADD COLUMN IF NOT EXISTS gbp_address_line1 text,
  ADD COLUMN IF NOT EXISTS gbp_address_line2 text,
  ADD COLUMN IF NOT EXISTS gbp_city varchar(100),
  ADD COLUMN IF NOT EXISTS gbp_province varchar(100),
  ADD COLUMN IF NOT EXISTS gbp_postal_code varchar(20),
  ADD COLUMN IF NOT EXISTS gbp_country varchar(100),
  ADD COLUMN IF NOT EXISTS gbp_latitude numeric(10,8),
  ADD COLUMN IF NOT EXISTS gbp_longitude numeric(11,8);

-- Create staging table for sync review
CREATE TABLE IF NOT EXISTS google_business_profile_syncs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  gbp_profile_id uuid REFERENCES google_business_profiles(id) ON DELETE CASCADE,
  
  -- Google Location Selection
  gbp_location_name varchar(500),
  gbp_account_id varchar(255),
  
  -- Raw payload from Google API
  google_raw_payload jsonb,
  
  -- Normalized staged data
  staged_data jsonb,
  
  -- Computed diff
  diff_data jsonb,
  
  -- Name mismatch detection
  name_mismatch boolean DEFAULT false,
  name_mismatch_details jsonb,
  
  -- Sync status
  status gbp_staging_sync_status DEFAULT 'pending',
  
  -- User decisions
  approved_fields jsonb DEFAULT '[]'::jsonb,
  rejected_fields jsonb DEFAULT '[]'::jsonb,
  
  -- Metadata
  sync_type varchar(50) DEFAULT 'initial',
  requested_by uuid REFERENCES users(id),
  approved_by uuid REFERENCES users(id),
  approved_at timestamp,
  expires_at timestamp,
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create available locations table for profile selection
CREATE TABLE IF NOT EXISTS google_available_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id uuid NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
  
  -- Google location data
  gbp_account_id varchar(255) NOT NULL,
  gbp_location_name varchar(500) NOT NULL,
  gbp_business_name varchar(255),
  gbp_address text,
  gbp_phone varchar(50),
  gbp_verification_status varchar(50),
  gbp_ownership_status varchar(50),
  
  -- Matching info
  is_selected boolean DEFAULT false,
  name_similarity_score numeric(5,2),
  
  -- Raw data
  raw_location_data jsonb,
  
  created_at timestamp DEFAULT now(),
  expires_at timestamp
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_gbp_syncs_business_id ON google_business_profile_syncs(business_id);
CREATE INDEX IF NOT EXISTS idx_gbp_syncs_status ON google_business_profile_syncs(status);
CREATE INDEX IF NOT EXISTS idx_gbp_available_locations_business_id ON google_available_locations(business_id);
