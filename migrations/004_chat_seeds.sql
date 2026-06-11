-- Conversation seed lines (moved from data/seeds.json)

CREATE TABLE IF NOT EXISTS chat_seeds (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  scope       text NOT NULL CHECK (scope IN ('general', 'stage')),
  stage_slug  text,
  kind        text NOT NULL CHECK (kind IN ('generated', 'fallback')),
  line        text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chat_seeds_stage_scope CHECK (
    (scope = 'general' AND stage_slug IS NULL)
    OR (scope = 'stage' AND stage_slug IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS chat_seeds_general
  ON chat_seeds (kind) WHERE scope = 'general';

CREATE INDEX IF NOT EXISTS chat_seeds_stage
  ON chat_seeds (stage_slug, kind) WHERE scope = 'stage';
