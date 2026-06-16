-- Manual curation — featured creator stages appear in the Switch Stages picker.
-- Example: UPDATE user_stages SET featured = true WHERE slug = 'my-stage';

ALTER TABLE user_stages
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS user_stages_featured
  ON user_stages (featured)
  WHERE featured = true AND taken_down_at IS NULL;
