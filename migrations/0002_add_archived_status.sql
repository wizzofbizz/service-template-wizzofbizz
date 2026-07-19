
-- Add 'archived' to quote_status enum
ALTER TYPE quote_status ADD VALUE IF NOT EXISTS 'archived';
