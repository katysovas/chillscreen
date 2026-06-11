-- Player wallet + loadout on the account (not localStorage)

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS coins integer NOT NULL DEFAULT 300 CHECK (coins >= 0);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS loadout jsonb NOT NULL DEFAULT '{}';
