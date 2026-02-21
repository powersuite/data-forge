-- Add enrichment tracking to lists
ALTER TABLE lists ADD COLUMN IF NOT EXISTS enriched boolean NOT NULL DEFAULT false;
ALTER TABLE lists ADD COLUMN IF NOT EXISTS enrichment_summary jsonb DEFAULT null;
