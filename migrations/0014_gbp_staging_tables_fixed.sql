-- GBP Staging Tables Migration (Fixed)
-- Creates staging tables with correct user reference type

-- Create staging table for sync review (drop if exists to recreate with correct types)
DROP TABLE IF EXISTS google_business_profile_syncs;

CREATE TABLE google_business_profile_syncs (
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
  requested_by varchar(255) REFERENCES users(id),
  approved_by varchar(255) REFERENCES users(id),
  approved_at timestamp,
  expires_at timestamp,
  
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_gbp_syncs_business_id ON google_business_profile_syncs(business_id);
CREATE INDEX IF NOT EXISTS idx_gbp_syncs_status ON google_business_profile_syncs(status);
