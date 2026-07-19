
-- Add key_takeaways column to blog_posts table
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS key_takeaways TEXT;
