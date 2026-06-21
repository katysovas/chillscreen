-- Curated-stage lineup votes and user suggestions (per PartyKit room + channel).

CREATE TABLE IF NOT EXISTS lineup_votes (
  room_id     text NOT NULL,
  channel     text NOT NULL,
  voter_id    text NOT NULL,
  video_id    text NOT NULL,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, channel, voter_id)
);

CREATE INDEX IF NOT EXISTS lineup_votes_room_channel_idx
  ON lineup_votes (room_id, channel);

CREATE TABLE IF NOT EXISTS lineup_suggestions (
  room_id       text NOT NULL,
  channel       text NOT NULL,
  video_id      text NOT NULL,
  video         jsonb NOT NULL,
  suggester_id  text,
  added_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (room_id, channel, video_id)
);

CREATE INDEX IF NOT EXISTS lineup_suggestions_room_channel_idx
  ON lineup_suggestions (room_id, channel);
