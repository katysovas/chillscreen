-- Track whether the festie owner is currently in-game (PartyKit / signed-in session).

ALTER TABLE festies
  ADD COLUMN IF NOT EXISTS owner_online boolean NOT NULL DEFAULT false;
