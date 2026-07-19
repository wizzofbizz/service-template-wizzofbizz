
-- Migration 0047: Fix blog_posts meta_title column length
-- Increase from 60 to 255 characters to accommodate longer SEO titles

ALTER TABLE blog_posts 
ALTER COLUMN meta_title TYPE VARCHAR(255);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Blog meta_title column length increased to 255 characters';
END $$;
