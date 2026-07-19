
-- Migration 0046: Add Blog System for SEO Content Marketing
-- Creates tables for blog posts, categories, and authors

-- Create blog_categories table
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  meta_description TEXT,
  parent_category_id UUID REFERENCES blog_categories(id) ON DELETE SET NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  featured_image_url TEXT,
  
  -- SEO fields
  meta_title VARCHAR(60),
  meta_description TEXT,
  meta_keywords TEXT,
  canonical_url TEXT,
  og_image_url TEXT,
  
  -- Author & Category
  author_id VARCHAR REFERENCES users(id),
  author_name VARCHAR(255),
  category_id UUID REFERENCES blog_categories(id),
  
  -- Status & Publishing
  status VARCHAR(20) DEFAULT 'draft', -- draft, published, scheduled, archived
  published_at TIMESTAMP,
  scheduled_publish_at TIMESTAMP,
  
  -- Reading & Engagement
  reading_time_minutes INTEGER,
  view_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  
  -- Internal linking
  related_post_ids UUID[],
  related_product_pages TEXT[],
  
  -- Structured data
  structured_data JSONB,
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create blog_tags table (for additional taxonomy)
CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create blog_post_tags junction table
CREATE TABLE IF NOT EXISTS blog_post_tags (
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  blog_tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_post_id, blog_tag_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_posts_category ON blog_posts(category_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_status ON blog_posts(status);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_at ON blog_posts(published_at);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_categories_slug ON blog_categories(slug);

-- Seed default blog categories
INSERT INTO blog_categories (name, slug, description, meta_description, display_order) VALUES
  ('Operations', 'operations', 'Process optimization and workflow tips for service businesses', 'Learn how to optimize your service business operations with expert tips and strategies.', 1),
  ('Marketing', 'marketing', 'Customer acquisition and branding strategies', 'Master marketing strategies to grow your service business and attract more customers.', 2),
  ('Finance', 'finance', 'Pricing, invoicing, and cash flow management', 'Financial tips and best practices for managing your service business finances.', 3),
  ('Technology', 'technology', 'Software tips and digital transformation', 'Stay ahead with technology insights and digital tools for service businesses.', 4),
  ('Industry Guides', 'industry-guides', 'Industry-specific content and best practices', 'Specialized guides for plumbing, cleaning, electrical, HVAC, and other service industries.', 5)
ON CONFLICT (slug) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Blog System Migration Complete';
  RAISE NOTICE 'Tables created: blog_posts, blog_categories, blog_tags, blog_post_tags';
  RAISE NOTICE 'Seeded 5 default blog categories';
END $$;
