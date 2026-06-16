-- Randomize now-playing when the first viewer opens an empty stage room.

ALTER TABLE user_stages
  ADD COLUMN IF NOT EXISTS shuffle_on_start boolean NOT NULL DEFAULT false;
