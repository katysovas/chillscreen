-- Festie Life modal — email recap opt-in

ALTER TABLE festies
  ADD COLUMN IF NOT EXISTS notify_email   text;

ALTER TABLE festies
  ADD COLUMN IF NOT EXISTS email_opted_in boolean NOT NULL DEFAULT false;
