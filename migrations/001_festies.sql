-- Festies v1 — run once in Neon SQL Editor (or: npm run db:migrate)

CREATE TABLE IF NOT EXISTS users (
  id         uuid PRIMARY KEY,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS festies (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            uuid NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  name               text NOT NULL,
  preset             text NOT NULL,
  attributes         jsonb NOT NULL DEFAULT '{}',
  topics             text[] NOT NULL DEFAULT '{}',
  personality_notes  text,
  stage_slug         text NOT NULL,
  last_seen_at       timestamptz NOT NULL DEFAULT now(),
  last_chat_at       timestamptz,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS festies_stage_active
  ON festies (stage_slug, last_seen_at);

CREATE TABLE IF NOT EXISTS festie_events (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  festie_id   uuid NOT NULL REFERENCES festies(id) ON DELETE CASCADE,
  type        text NOT NULL,
  payload     jsonb NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS festie_events_recap
  ON festie_events (festie_id, created_at);

CREATE TABLE IF NOT EXISTS festie_conversations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  festie_id   uuid NOT NULL REFERENCES festies(id) ON DELETE CASCADE,
  player_id   uuid REFERENCES users(id),
  messages    jsonb NOT NULL DEFAULT '[]',
  created_at  timestamptz NOT NULL DEFAULT now()
);
