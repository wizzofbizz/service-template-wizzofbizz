
-- Add quote_version_items table to track line items per version
CREATE TABLE IF NOT EXISTS quote_version_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_version_id UUID NOT NULL REFERENCES quote_versions(id) ON DELETE CASCADE,
  service_id UUID REFERENCES services(id),
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  line_total DECIMAL(10, 2) NOT NULL,
  display_order INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_quote_version_items_version_id ON quote_version_items(quote_version_id);

COMMENT ON TABLE quote_version_items IS 'Line items specific to each quote version for accurate historical tracking';
