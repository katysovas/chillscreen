ALTER TABLE festies
  ADD COLUMN IF NOT EXISTS control_mode text NOT NULL DEFAULT 'human';

ALTER TABLE festies
  DROP CONSTRAINT IF EXISTS festies_control_mode_check;

ALTER TABLE festies
  ADD CONSTRAINT festies_control_mode_check
  CHECK (control_mode IN ('human', 'ai'));
