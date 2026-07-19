
-- Add contact_id column to activity_log table
ALTER TABLE activity_log 
ADD COLUMN IF NOT EXISTS contact_id UUID 
REFERENCES contacts(id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_activity_log_contact_id 
ON activity_log(contact_id);
