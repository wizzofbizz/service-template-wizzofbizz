
-- Update quote_followup_days from integer to JSONB array
ALTER TABLE businesses 
DROP COLUMN IF EXISTS quote_followup_days;

ALTER TABLE businesses 
ADD COLUMN quote_followup_days JSONB DEFAULT '[3, 7, 14]';
