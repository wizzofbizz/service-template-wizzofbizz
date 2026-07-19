
-- Migration 0040: Add Custom Domains table
-- This migration creates the custom domains feature for businesses

-- Create enums for custom domains
DO $$ 
BEGIN
    -- Create domain_type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'domain_type') THEN
        CREATE TYPE domain_type AS ENUM ('full', 'quote_subdomain');
        RAISE NOTICE 'Created domain_type enum';
    END IF;

    -- Create domain_status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'domain_status') THEN
        CREATE TYPE domain_status AS ENUM ('pending', 'verified', 'failed');
        RAISE NOTICE 'Created domain_status enum';
    END IF;

    -- Create verification_method enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'verification_method') THEN
        CREATE TYPE verification_method AS ENUM ('a_record', 'txt_record');
        RAISE NOTICE 'Created verification_method enum';
    END IF;

    -- Create ssl_status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ssl_status') THEN
        CREATE TYPE ssl_status AS ENUM ('pending', 'issued', 'failed');
        RAISE NOTICE 'Created ssl_status enum';
    END IF;
END $$;

-- Create custom_domains table
CREATE TABLE IF NOT EXISTS custom_domains (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    domain_type domain_type NOT NULL,
    domain VARCHAR(255) NOT NULL UNIQUE,
    status domain_status NOT NULL DEFAULT 'pending',
    verification_token VARCHAR(64) NOT NULL,
    verification_method verification_method,
    last_verified_at TIMESTAMP,
    ssl_status ssl_status DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_custom_domains_domain ON custom_domains(domain);
CREATE INDEX IF NOT EXISTS idx_custom_domains_business_id ON custom_domains(business_id);
CREATE INDEX IF NOT EXISTS idx_custom_domains_status ON custom_domains(status);

-- Add unique constraint to prevent multiple domains of same type per business
CREATE UNIQUE INDEX IF NOT EXISTS idx_custom_domains_business_type ON custom_domains(business_id, domain_type);

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Custom Domains Migration Complete';
    RAISE NOTICE 'Created custom_domains table with enums and indexes';
END $$;
