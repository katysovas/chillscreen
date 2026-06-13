CREATE TABLE IF NOT EXISTS easel (
  stage          text NOT NULL,
  slot           smallint NOT NULL,
  npc            text NOT NULL,
  drawing_id     text NOT NULL,
  total_segments int NOT NULL,
  segments_done  int NOT NULL DEFAULT 0,
  rate           real NOT NULL DEFAULT 0.35,
  status         text NOT NULL DEFAULT 'painting',
  started_at     timestamptz NOT NULL DEFAULT now(),
  completed_at   timestamptz null,
  hidden_at      timestamptz null,
  PRIMARY KEY (stage, slot)
);
