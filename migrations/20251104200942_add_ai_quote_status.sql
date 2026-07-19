-- Add 'ai_quote' status to quote_status enum
ALTER TYPE quote_status ADD VALUE IF NOT EXISTS 'ai_quote' BEFORE 'sent';
