-- Query-path indexes for festie cron, recap, stage lifecycle, and easel visibility.

-- Offline festie NPC chatter cron (owner_online = false + last_seen_at window).
CREATE INDEX IF NOT EXISTS festies_offline_chatter
  ON festies (last_seen_at)
  WHERE owner_online = false;

-- Correlated npc_chatter count in listFestiesDueForOfflineNpcChat.
CREATE INDEX IF NOT EXISTS festie_events_npc_chatter
  ON festie_events (festie_id, type, created_at)
  WHERE type = 'npc_chatter';

-- Broader festie_events lookups filtered by type (recap, coins, etc.).
CREATE INDEX IF NOT EXISTS festie_events_festie_type_created
  ON festie_events (festie_id, type, created_at);

-- countFestieChatsSince — festie_id + created_at range.
CREATE INDEX IF NOT EXISTS festie_conversations_festie_created
  ON festie_conversations (festie_id, created_at);

-- reclaimStaleStageSlugs — active rows by last_active_at.
CREATE INDEX IF NOT EXISTS user_stages_active_last_active
  ON user_stages (last_active_at)
  WHERE taken_down_at IS NULL;

-- One active stage per owner; allow multiple soft-deleted rows per owner.
DROP INDEX IF EXISTS user_stages_one_per_owner;
CREATE UNIQUE INDEX IF NOT EXISTS user_stages_one_active_owner
  ON user_stages (owner_id)
  WHERE taken_down_at IS NULL;

-- Visible easel rows per stage room.
CREATE INDEX IF NOT EXISTS easel_stage_visible
  ON easel (stage, slot)
  WHERE hidden_at IS NULL;
