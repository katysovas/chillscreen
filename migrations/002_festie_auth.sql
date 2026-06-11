-- Festie name + password auth (multi-device)

ALTER TABLE users
  ALTER COLUMN id SET DEFAULT gen_random_uuid();

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS password_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS festies_name_lower_idx
  ON festies (lower(trim(name)));
