-- One-time post-signup help popup — dismissed timestamp on festie row.

ALTER TABLE festies
  ADD COLUMN IF NOT EXISTS help_dismissed_at timestamptz DEFAULT now();

ALTER TABLE festies
  ALTER COLUMN help_dismissed_at DROP DEFAULT;
