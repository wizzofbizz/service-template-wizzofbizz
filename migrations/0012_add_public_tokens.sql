
-- Add public tokens for customer access to quotes and invoices
DO $$ BEGIN
  ALTER TABLE quotes ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;
  ALTER TABLE quotes ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE invoices ADD COLUMN IF NOT EXISTS public_token TEXT UNIQUE;
  ALTER TABLE invoices ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMP;
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Generate public tokens for existing records
UPDATE quotes SET public_token = gen_random_uuid()::text WHERE public_token IS NULL;
UPDATE invoices SET public_token = gen_random_uuid()::text WHERE public_token IS NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_quotes_public_token ON quotes(public_token);
CREATE INDEX IF NOT EXISTS idx_invoices_public_token ON invoices(public_token);
