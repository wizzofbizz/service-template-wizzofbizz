
-- Add payment reminder settings to businesses table
ALTER TABLE businesses 
ADD COLUMN default_payment_due_days INTEGER DEFAULT 30,
ADD COLUMN payment_reminder_days JSONB DEFAULT '[3, 7, 14]';

-- Add reminder tracking to invoices table
ALTER TABLE invoices
ADD COLUMN reminders_sent INTEGER DEFAULT 0,
ADD COLUMN last_reminder_sent_at TIMESTAMP;
