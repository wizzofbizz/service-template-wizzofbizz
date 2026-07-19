-- Add image analysis configuration to services
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_analysis_config JSONB DEFAULT '{"enabled": false, "requiredPhotos": [], "analysisHints": ""}';
