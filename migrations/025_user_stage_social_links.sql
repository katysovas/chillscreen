-- Optional social / website links on creator stages (Info tab).

ALTER TABLE user_stages
  ADD COLUMN IF NOT EXISTS social_links jsonb NOT NULL DEFAULT '{}';
