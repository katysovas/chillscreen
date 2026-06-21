-- User-created stages v1

CREATE TABLE IF NOT EXISTS user_stages (
  slug               text PRIMARY KEY,
  owner_id           uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  festie_id          uuid NOT NULL REFERENCES festies(id) ON DELETE CASCADE,
  preset             text NOT NULL,
  sky                text,
  streams            jsonb NOT NULL DEFAULT '[]',
  now_playing_index  int NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  last_active_at     timestamptz NOT NULL DEFAULT now(),
  taken_down_at      timestamptz
);

-- One stage per owner was removed in 019_multi_stage_per_owner.sql.

CREATE INDEX IF NOT EXISTS user_stages_last_active
  ON user_stages (last_active_at);
