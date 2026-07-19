
-- Migration 0036: Add Deposit-Based Booking System
-- This migration implements the complete deposit flow with automated reminders and cancellation

-- 1. Create new enum types if they don't exist
DO $$ 
BEGIN
    -- Create invoice_type enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_type') THEN
        CREATE TYPE invoice_type AS ENUM ('deposit', 'final', 'standard');
        RAISE NOTICE 'Created invoice_type enum';
    ELSE
        RAISE NOTICE 'invoice_type enum already exists';
    END IF;

    -- Create deposit_cancellation_mode enum if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'deposit_cancellation_mode') THEN
        CREATE TYPE deposit_cancellation_mode AS ENUM ('auto', 'manual');
        RAISE NOTICE 'Created deposit_cancellation_mode enum';
    ELSE
        RAISE NOTICE 'deposit_cancellation_mode enum already exists';
    END IF;
END $$;

-- 2. Add new job statuses to existing job_status enum
DO $$ 
BEGIN
    -- Add 'pending_deposit' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'pending_deposit' 
        AND enumtypid = 'job_status'::regtype
    ) THEN
        ALTER TYPE job_status ADD VALUE 'pending_deposit' AFTER 'draft';
        RAISE NOTICE 'Added pending_deposit to job_status enum';
    ELSE
        RAISE NOTICE 'pending_deposit already exists in job_status enum';
    END IF;

    -- Add 'deposit_paid' if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'deposit_paid' 
        AND enumtypid = 'job_status'::regtype
    ) THEN
        ALTER TYPE job_status ADD VALUE 'deposit_paid' AFTER 'pending_deposit';
        RAISE NOTICE 'Added deposit_paid to job_status enum';
    ELSE
        RAISE NOTICE 'deposit_paid already exists in job_status enum';
    END IF;
END $$;

-- 3. Extend quotes table with deposit fields
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotes' AND column_name = 'requires_deposit'
    ) THEN
        ALTER TABLE quotes ADD COLUMN requires_deposit BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added requires_deposit to quotes';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotes' AND column_name = 'deposit_amount'
    ) THEN
        ALTER TABLE quotes ADD COLUMN deposit_amount DECIMAL(10, 2);
        RAISE NOTICE 'Added deposit_amount to quotes';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'quotes' AND column_name = 'deposit_percentage'
    ) THEN
        ALTER TABLE quotes ADD COLUMN deposit_percentage DECIMAL(5, 2);
        RAISE NOTICE 'Added deposit_percentage to quotes';
    END IF;
END $$;

-- 4. Extend jobs table with deposit tracking
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'deposit_paid'
    ) THEN
        ALTER TABLE jobs ADD COLUMN deposit_paid BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added deposit_paid to jobs';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'deposit_paid_at'
    ) THEN
        ALTER TABLE jobs ADD COLUMN deposit_paid_at TIMESTAMP;
        RAISE NOTICE 'Added deposit_paid_at to jobs';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'deposit_invoice_id'
    ) THEN
        ALTER TABLE jobs ADD COLUMN deposit_invoice_id UUID REFERENCES invoices(id);
        RAISE NOTICE 'Added deposit_invoice_id to jobs';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'deposit_deadline'
    ) THEN
        ALTER TABLE jobs ADD COLUMN deposit_deadline TIMESTAMP;
        RAISE NOTICE 'Added deposit_deadline to jobs';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'deposit_reminders_sent'
    ) THEN
        ALTER TABLE jobs ADD COLUMN deposit_reminders_sent INTEGER DEFAULT 0;
        RAISE NOTICE 'Added deposit_reminders_sent to jobs';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'jobs' AND column_name = 'last_deposit_reminder_at'
    ) THEN
        ALTER TABLE jobs ADD COLUMN last_deposit_reminder_at TIMESTAMP;
        RAISE NOTICE 'Added last_deposit_reminder_at to jobs';
    END IF;
END $$;

-- 5. Extend invoices table with deposit fields
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'invoice_type'
    ) THEN
        ALTER TABLE invoices ADD COLUMN invoice_type invoice_type DEFAULT 'standard';
        RAISE NOTICE 'Added invoice_type to invoices';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'quote_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN quote_id UUID REFERENCES quotes(id);
        RAISE NOTICE 'Added quote_id to invoices';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'deposit_amount'
    ) THEN
        ALTER TABLE invoices ADD COLUMN deposit_amount DECIMAL(10, 2);
        RAISE NOTICE 'Added deposit_amount to invoices';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'balance_due'
    ) THEN
        ALTER TABLE invoices ADD COLUMN balance_due DECIMAL(10, 2);
        RAISE NOTICE 'Added balance_due to invoices';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'invoices' AND column_name = 'linked_deposit_invoice_id'
    ) THEN
        ALTER TABLE invoices ADD COLUMN linked_deposit_invoice_id UUID REFERENCES invoices(id);
        RAISE NOTICE 'Added linked_deposit_invoice_id to invoices';
    END IF;
END $$;

-- 6. Extend businesses table with deposit policy fields
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'deposit_cancellation_mode'
    ) THEN
        ALTER TABLE businesses ADD COLUMN deposit_cancellation_mode deposit_cancellation_mode DEFAULT 'manual';
        RAISE NOTICE 'Added deposit_cancellation_mode to businesses';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'deposit_cancellation_threshold_hours'
    ) THEN
        ALTER TABLE businesses ADD COLUMN deposit_cancellation_threshold_hours INTEGER DEFAULT 24;
        RAISE NOTICE 'Added deposit_cancellation_threshold_hours to businesses';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'deposit_reminder_hours'
    ) THEN
        ALTER TABLE businesses ADD COLUMN deposit_reminder_hours JSONB DEFAULT '[48, 24, 12]'::jsonb;
        RAISE NOTICE 'Added deposit_reminder_hours to businesses';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'require_deposit_by_default'
    ) THEN
        ALTER TABLE businesses ADD COLUMN require_deposit_by_default BOOLEAN DEFAULT FALSE;
        RAISE NOTICE 'Added require_deposit_by_default to businesses';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'businesses' AND column_name = 'default_deposit_percentage'
    ) THEN
        ALTER TABLE businesses ADD COLUMN default_deposit_percentage DECIMAL(5, 2) DEFAULT 30.00;
        RAISE NOTICE 'Added default_deposit_percentage to businesses';
    END IF;
END $$;

-- 7. Create deposit_policies table if it doesn't exist
CREATE TABLE IF NOT EXISTS deposit_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    deposit_percentage DECIMAL(5, 2) NOT NULL,
    cancellation_threshold_hours INTEGER NOT NULL,
    auto_reminders BOOLEAN DEFAULT TRUE,
    auto_cancellation BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(business_id, service_id)
);

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_deposit_paid ON jobs(deposit_paid);
CREATE INDEX IF NOT EXISTS idx_jobs_deposit_invoice_id ON jobs(deposit_invoice_id);
CREATE INDEX IF NOT EXISTS idx_invoices_quote_id ON invoices(quote_id);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON invoices(invoice_type);
CREATE INDEX IF NOT EXISTS idx_quotes_requires_deposit ON quotes(requires_deposit);
CREATE INDEX IF NOT EXISTS idx_deposit_policies_business ON deposit_policies(business_id);
CREATE INDEX IF NOT EXISTS idx_deposit_policies_service ON deposit_policies(service_id);

-- 9. Backfill existing data with safe defaults
UPDATE quotes SET requires_deposit = FALSE WHERE requires_deposit IS NULL;
UPDATE jobs SET deposit_paid = FALSE WHERE deposit_paid IS NULL;
UPDATE jobs SET deposit_reminders_sent = 0 WHERE deposit_reminders_sent IS NULL;
UPDATE invoices SET invoice_type = 'standard' WHERE invoice_type IS NULL;

-- Success message
DO $$
BEGIN
    RAISE NOTICE '✅ Deposit System Migration Complete';
    RAISE NOTICE 'Tables updated: quotes, jobs, invoices, businesses';
    RAISE NOTICE 'New table created: deposit_policies';
    RAISE NOTICE 'New enums: invoice_type, deposit_cancellation_mode';
    RAISE NOTICE 'New job statuses: pending_deposit, deposit_paid';
END $$;
