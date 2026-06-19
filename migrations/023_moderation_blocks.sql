-- Chat moderation — blocks for accounts, display names, and IPs.

CREATE TABLE IF NOT EXISTS moderation_blocks (
  id          bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  kind        text NOT NULL CHECK (kind IN ('user_id', 'display_name', 'ip')),
  value       text NOT NULL,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS moderation_blocks_kind_value
  ON moderation_blocks (kind, value);
