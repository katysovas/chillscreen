-- Human-readable stage name for creator truss labels.

ALTER TABLE user_stages
  ADD COLUMN IF NOT EXISTS display_name text;

UPDATE user_stages
SET display_name = slug
WHERE display_name IS NULL;

ALTER TABLE user_stages
  ALTER COLUMN display_name SET NOT NULL;
