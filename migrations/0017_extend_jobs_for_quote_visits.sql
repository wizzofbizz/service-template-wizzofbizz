
-- Extend jobs table for quote visit tracking
DO $$ BEGIN
  ALTER TABLE jobs ADD COLUMN IF NOT EXISTS job_type VARCHAR(50) DEFAULT 'regular';
  ALTER TABLE jobs ADD COLUMN IF NOT EXISTS related_quote_version_id UUID REFERENCES quote_versions(id);
EXCEPTION
  WHEN duplicate_column THEN NULL;
END $$;

-- Add constraint for job_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_job_type'
  ) THEN
    ALTER TABLE jobs ADD CONSTRAINT check_job_type 
      CHECK (job_type IN ('regular', 'quote_visit', 'follow_up', 'emergency'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_jobs_quote_version ON jobs(related_quote_version_id);

COMMENT ON COLUMN jobs.job_type IS 'Type of job: regular, quote_visit, follow_up, or emergency';
COMMENT ON COLUMN jobs.related_quote_version_id IS 'Links to quote version if this is a site visit for quote refinement';
