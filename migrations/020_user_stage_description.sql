-- Short homepage blurb for creator stages.

ALTER TABLE user_stages
  ADD COLUMN IF NOT EXISTS description text;
