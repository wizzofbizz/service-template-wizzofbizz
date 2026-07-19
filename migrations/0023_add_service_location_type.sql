
-- Add service_location_type to quotes table
ALTER TABLE quotes 
ADD COLUMN IF NOT EXISTS service_location_type VARCHAR(20) DEFAULT 'customer';

COMMENT ON COLUMN quotes.service_location_type IS 'Where service is performed: customer (mobile/on-site) or business (in-office)';

-- Add check constraint to ensure valid values
ALTER TABLE quotes
ADD CONSTRAINT check_service_location_type CHECK (service_location_type IN ('customer', 'business'));
