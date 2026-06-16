-- Per-stage custom backdrop (City template skyline image).

ALTER TABLE user_stages
  ADD COLUMN IF NOT EXISTS backdrop_url text;
