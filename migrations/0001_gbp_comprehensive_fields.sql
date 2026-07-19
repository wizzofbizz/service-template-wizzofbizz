-- Migration: Add comprehensive GBP integration fields
-- Purpose: Add all fields required for complete Google Business Profile integration
-- Date: 2024-11-29

-- ============================================
-- BUSINESSES TABLE - New Fields
-- ============================================

-- Structured Operating Hours
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_regular_hours JSONB;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_special_hours JSONB DEFAULT '[]';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_opening_date DATE;

-- Additional Social URLs
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS twitter_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS linked_in_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS youtube_url TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tik_tok_url TEXT;

-- Business Attributes for GBP
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_attributes JSONB DEFAULT '{}';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS primary_service_id UUID;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS secondary_service_ids JSONB DEFAULT '[]';

-- Office Visit & Status
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS office_visit_policy VARCHAR(50);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS business_status VARCHAR(50) DEFAULT 'OPEN';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS temporary_closure_start_date DATE;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS temporary_closure_end_date DATE;

-- ============================================
-- GOOGLE_BUSINESS_PROFILES TABLE - New Fields
-- ============================================

-- Secondary Categories IDs
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_secondary_categories_ids JSONB DEFAULT '[]';

-- Structured Operating Hours
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_regular_hours JSONB;
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_special_hours JSONB DEFAULT '[]';

-- Service Areas Configuration
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_service_area_type VARCHAR(50);
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_service_area_radius JSONB;
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_service_area_postal_codes JSONB DEFAULT '[]';

-- Services Configuration
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_primary_service VARCHAR(255);
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_secondary_services JSONB DEFAULT '[]';

-- Business Attributes (SEO critical)
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_business_attributes JSONB DEFAULT '{}';
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_category_specific_attributes JSONB;
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_custom_attributes JSONB DEFAULT '[]';

-- Photos & Media
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_profile_photo_url TEXT;
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_photos_urls JSONB DEFAULT '[]';
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_videos_urls JSONB DEFAULT '[]';

-- Social & Communication
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_facebook_url TEXT;
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_instagram_url TEXT;
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_twitter_url TEXT;
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_linked_in_url TEXT;
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_youtube_url TEXT;
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_tik_tok_url TEXT;
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_whatsapp_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_whatsapp_number VARCHAR(50);
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_messaging_config JSONB;

-- Appointment Booking
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_appointment_booking_url TEXT;

-- Opening Status & Info
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_opening_date DATE;
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_business_status VARCHAR(50) DEFAULT 'OPEN';
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_currently_open BOOLEAN;
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_temporary_closure_start_date DATE;
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_temporary_closure_end_date DATE;

-- Office Visit Policy
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_office_visit_policy VARCHAR(50);

-- Profile Completeness & Quality (SEO tracking)
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_profile_completeness_percent INTEGER DEFAULT 0;
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_missing_required_fields JSONB DEFAULT '[]';
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_last_completeness_check_at TIMESTAMP;
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_quality_score INTEGER;
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_quality_score_last_updated TIMESTAMP;

-- Posts Caching
ALTER TABLE google_business_profiles ADD COLUMN IF NOT EXISTS gbp_latest_posts_cache JSONB DEFAULT '[]';

-- ============================================
-- INDEXES for Performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_businesses_business_status ON businesses(business_status);
CREATE INDEX IF NOT EXISTS idx_gbp_profiles_business_status ON google_business_profiles(gbp_business_status);
CREATE INDEX IF NOT EXISTS idx_gbp_profiles_completeness ON google_business_profiles(gbp_profile_completeness_percent);
CREATE INDEX IF NOT EXISTS idx_gbp_profiles_quality_score ON google_business_profiles(gbp_quality_score);

-- ============================================
-- COMMENTS for Documentation
-- ============================================

COMMENT ON COLUMN businesses.business_regular_hours IS 'Structured operating hours per day (JSON with open/close times)';
COMMENT ON COLUMN businesses.business_special_hours IS 'Special hours for holidays and exceptions';
COMMENT ON COLUMN businesses.office_visit_policy IS 'ALLOW, BY_APPOINTMENT, or NOT_ALLOWED';
COMMENT ON COLUMN businesses.business_status IS 'OPEN, CLOSED_TEMPORARILY, or CLOSED_PERMANENTLY';

COMMENT ON COLUMN google_business_profiles.gbp_regular_hours IS 'Structured operating hours for Google Business Profile';
COMMENT ON COLUMN google_business_profiles.gbp_special_hours IS 'Holiday and exception hours for Google';
COMMENT ON COLUMN google_business_profiles.gbp_service_area_type IS 'RADIUS, POSTAL_CODES, or AREAS';
COMMENT ON COLUMN google_business_profiles.gbp_business_attributes IS 'Boolean attributes like wheelchair_accessible, has_wifi, etc.';
COMMENT ON COLUMN google_business_profiles.gbp_profile_completeness_percent IS 'Calculated percentage of profile completion for SEO';
COMMENT ON COLUMN google_business_profiles.gbp_quality_score IS 'Google-provided quality score for the profile';
