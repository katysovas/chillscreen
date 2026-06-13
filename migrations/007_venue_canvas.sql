CREATE TABLE IF NOT EXISTS venue_canvases (
  stage_slug  text PRIMARY KEY,
  strokes     jsonb NOT NULL DEFAULT '[]',
  updated_at  timestamptz NOT NULL DEFAULT now()
);
