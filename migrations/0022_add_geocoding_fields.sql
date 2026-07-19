-- Add geocoding fields to businesses
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS address_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS address_longitude DECIMAL(11, 8);

-- Add geocoding fields to contacts
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS address_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS address_longitude DECIMAL(11, 8);

-- Add geocoding fields to quotes
ALTER TABLE quotes
ADD COLUMN IF NOT EXISTS location_latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS location_longitude DECIMAL(11, 8);
