-- Add Google Business Profile Integration

-- Create enums for GBP
CREATE TYPE "gbp_verification_status" AS ENUM ('unverified', 'claimed', 'verified');
CREATE TYPE "gbp_sync_status" AS ENUM ('idle', 'syncing', 'error', 'pending');
CREATE TYPE "gbp_consent_status" AS ENUM ('pending', 'granted', 'declined');
CREATE TYPE "gbp_rate_limit_status" AS ENUM ('normal', 'warning', 'exceeded');

-- Create google_business_profiles table
CREATE TABLE IF NOT EXISTS "google_business_profiles" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "business_id" uuid NOT NULL UNIQUE REFERENCES "businesses"("id") ON DELETE cascade,
  
  -- Core Identification
  "gbp_account_id" varchar(255),
  "gbp_business_id" varchar(255) UNIQUE,
  "gbp_verification_status" "gbp_verification_status" DEFAULT 'unverified',
  "gbp_verification_token" varchar(500),
  "gbp_is_primary" boolean DEFAULT true,
  
  -- Profile Data
  "gbp_primary_category" varchar(255),
  "gbp_secondary_categories" jsonb DEFAULT '[]'::jsonb,
  "gbp_description" text,
  "gbp_cover_photo_url" text,
  "gbp_operating_hours" jsonb,
  "gbp_service_areas" jsonb DEFAULT '[]'::jsonb,
  "gbp_attribute_keywords" jsonb DEFAULT '[]'::jsonb,
  
  -- Analytics Caching
  "gbp_reviews_count" integer DEFAULT 0,
  "gbp_average_rating" numeric(3,2) DEFAULT 0,
  "gbp_photo_views_count" integer DEFAULT 0,
  "gbp_photo_clicks_count" integer DEFAULT 0,
  "gbp_directions_requests_count" integer DEFAULT 0,
  "gbp_website_clicks_count" integer DEFAULT 0,
  "gbp_analytics_last_synced_at" timestamp,
  "gbp_cached_analytics" jsonb,
  
  -- OAuth & API Authentication
  "gbp_access_token" text,
  "gbp_access_token_expires_at" timestamp,
  "gbp_refresh_token" text,
  "gbp_oauth_scopes" jsonb DEFAULT '[]'::jsonb,
  "gbp_oauth_granted_at" timestamp,
  
  -- Sync & Error Tracking
  "gbp_sync_status" "gbp_sync_status" DEFAULT 'idle',
  "gbp_last_synced_at" timestamp,
  "gbp_last_sync_error_at" timestamp,
  "gbp_last_sync_error_message" text,
  "gbp_sync_retry_count" integer DEFAULT 0,
  "gbp_sync_error_log" jsonb DEFAULT '[]'::jsonb,
  "gbp_next_scheduled_sync_at" timestamp,
  
  -- Feature Configuration
  "gbp_posts_enabled" boolean DEFAULT false,
  "gbp_posts_config" jsonb,
  "gbp_booking_integration_enabled" boolean DEFAULT false,
  "gbp_booking_config" jsonb,
  "gbp_local_services_ads_enabled" boolean DEFAULT false,
  "gbp_local_services_ads_config" jsonb,
  "gbp_messaging_enabled" boolean DEFAULT false,
  
  -- Content Management
  "gbp_website_links" jsonb,
  "gbp_attributes_config" jsonb,
  "gbp_business_hours" jsonb,
  "gbp_service_types_config" jsonb,
  "gbp_media_policy" jsonb,
  
  -- Notifications & Consent
  "gbp_notification_preferences" jsonb,
  "gbp_consent_status" "gbp_consent_status" DEFAULT 'pending',
  "gbp_consent_recorded_at" timestamp,
  "gbp_data_collection_allowed" boolean DEFAULT true,
  
  -- Duplicates & Merging
  "gbp_duplicate_listings" jsonb DEFAULT '[]'::jsonb,
  "gbp_merged_from_ids" jsonb DEFAULT '[]'::jsonb,
  
  -- Integration & Metadata
  "gbp_external_integrations" jsonb,
  "gbp_feature_flags" jsonb DEFAULT '{}'::jsonb,
  "gbp_metadata" jsonb,
  "gbp_version" integer DEFAULT 1,
  
  -- Rate Limiting & API Quota
  "gbp_api_calls_this_month" integer DEFAULT 0,
  "gbp_api_calls_limit" integer DEFAULT 5000,
  "gbp_api_calls_reset_date" date,
  "gbp_rate_limit_status" "gbp_rate_limit_status" DEFAULT 'normal',
  
  -- Timestamps
  "created_at" timestamp DEFAULT NOW(),
  "updated_at" timestamp DEFAULT NOW()
);

-- Create indices for commonly queried fields
CREATE INDEX "idx_gbp_business_id" ON "google_business_profiles"("business_id");
CREATE INDEX "idx_gbp_verification_status" ON "google_business_profiles"("gbp_verification_status");
CREATE INDEX "idx_gbp_sync_status" ON "google_business_profiles"("gbp_sync_status");
CREATE INDEX "idx_gbp_next_sync" ON "google_business_profiles"("gbp_next_scheduled_sync_at");
