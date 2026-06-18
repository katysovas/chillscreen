import { FESTIE_CONFIG, festieTier } from '@/lib/festie/config';
import {
  DEFAULT_FESTIE_LLM_PROVIDER,
  type FestieLlmProvider,
  parseFestieLlmProvider,
} from '@/lib/festie/llmProviders';
import type {
  FestieAttributes,
  FestieControlMode,
  FestieOwner,
  FestiePreset,
  FestiePublic,
  FestieRow,
} from '@/lib/festie/types';
import { requireDb } from '@/lib/db';
import { toIsoTimestamp } from '@/lib/timestamps';
import { isMissingColumnError } from '@/lib/dbErrors';
import { parseFestieControlMode } from '@/lib/festie/types';

export class FestieSchemaError extends Error {
  readonly migration: string;

  constructor(migration: string, message: string) {
    super(message);
    this.name = 'FestieSchemaError';
    this.migration = migration;
  }
}

function rowToFestie(row: Record<string, unknown>): FestieRow {
  const attrs = row.attributes;
  return {
    id: String(row.id),
    user_id: String(row.user_id),
    name: String(row.name),
    preset: String(row.preset) as FestiePreset,
    attributes: (typeof attrs === 'object' && attrs !== null
      ? attrs
      : { energy: 5, friendliness: 5, chattiness: 5 }) as FestieAttributes,
    topics: Array.isArray(row.topics) ? row.topics.map(String) : [],
    personality_notes: row.personality_notes != null ? String(row.personality_notes) : null,
    stage_slug: String(row.stage_slug),
    llm_provider: parseFestieLlmProvider(row.llm_provider) ?? DEFAULT_FESTIE_LLM_PROVIDER,
    last_seen_at: toIsoTimestamp(row.last_seen_at),
    last_chat_at: row.last_chat_at != null ? toIsoTimestamp(row.last_chat_at) : null,
    owner_online: row.owner_online != null ? Boolean(row.owner_online) : false,
    notify_email: row.notify_email != null ? String(row.notify_email) : null,
    email_opted_in: Boolean(row.email_opted_in),
    help_dismissed_at: row.help_dismissed_at != null
      ? toIsoTimestamp(row.help_dismissed_at)
      : null,
    control_mode: parseFestieControlMode(row.control_mode) ?? 'human',
    created_at: toIsoTimestamp(row.created_at),
  };
}

export function toFestieOwner(row: FestieRow): FestieOwner {
  return {
    ...toFestiePublic(row),
    notify_email: row.notify_email,
    email_opted_in: row.email_opted_in,
    help_dismissed_at: row.help_dismissed_at,
    control_mode: row.control_mode,
  };
}

export function toFestiePublic(row: FestieRow): FestiePublic {
  return {
    id: row.id,
    name: row.name,
    preset: row.preset,
    attributes: row.attributes,
    topics: row.topics,
    personality_notes: row.personality_notes,
    stage_slug: row.stage_slug,
    llm_provider: row.llm_provider,
    last_seen_at: row.last_seen_at,
    tier: festieTier(new Date(row.last_seen_at)),
    owner_on_stage: row.owner_online,
  };
}

export async function createFestieForNewUser(
  passwordHash: string,
  input: Omit<CreateFestieInput, 'userId'>,
): Promise<FestieRow> {
  const sql = requireDb();
  const userRows = await sql`
    INSERT INTO users (password_hash) VALUES (${passwordHash})
    RETURNING id
  `;
  const userId = String((userRows[0] as { id: string }).id);
  const rows = await sql`
    INSERT INTO festies (
      user_id, name, preset, attributes, topics, personality_notes, stage_slug
    ) VALUES (
      ${userId}::uuid,
      ${input.name},
      ${input.preset},
      ${JSON.stringify(input.attributes)}::jsonb,
      ${input.topics},
      ${input.personality_notes},
      ${input.stage_slug}
    )
    RETURNING *
  `;
  return rowToFestie(rows[0] as Record<string, unknown>);
}

export async function getFestieByUserId(userId: string): Promise<FestieRow | null> {
  const sql = requireDb();
  const rows = await sql`
    SELECT * FROM festies WHERE user_id = ${userId}::uuid LIMIT 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  return row ? rowToFestie(row) : null;
}

export type CreateFestieInput = {
  userId: string;
  name: string;
  preset: FestiePreset;
  attributes: FestieAttributes;
  topics: string[];
  personality_notes: string | null;
  stage_slug: string;
};


export type UpdateFestieInput = {
  name?: string;
  preset?: FestiePreset;
  attributes?: FestieAttributes;
  topics?: string[];
  personality_notes?: string | null;
  stage_slug?: string;
  notify_email?: string | null;
  email_opted_in?: boolean;
  llm_provider?: FestieLlmProvider;
  control_mode?: FestieControlMode;
};

export async function updateFestie(userId: string, patch: UpdateFestieInput): Promise<FestieRow | null> {
  const existing = await getFestieByUserId(userId);
  if (!existing) return null;

  const sql = requireDb();
  const rows = await sql`
    UPDATE festies SET
      name = ${patch.name ?? existing.name},
      preset = ${patch.preset ?? existing.preset},
      attributes = ${JSON.stringify(patch.attributes ?? existing.attributes)}::jsonb,
      topics = ${patch.topics ?? existing.topics},
      personality_notes = ${patch.personality_notes !== undefined
    ? patch.personality_notes
    : existing.personality_notes},
      stage_slug = ${patch.stage_slug ?? existing.stage_slug},
      notify_email = ${patch.notify_email !== undefined
    ? patch.notify_email
    : existing.notify_email},
      email_opted_in = ${patch.email_opted_in ?? existing.email_opted_in}
    WHERE user_id = ${userId}::uuid
    RETURNING *
  `;
  let row = rowToFestie(rows[0] as Record<string, unknown>);

  if (patch.llm_provider !== undefined) {
    try {
      const llmRows = await sql`
        UPDATE festies SET llm_provider = ${patch.llm_provider}
        WHERE user_id = ${userId}::uuid
        RETURNING *
      `;
      row = rowToFestie(llmRows[0] as Record<string, unknown>);
    } catch (err) {
      if (isMissingColumnError(err, 'llm_provider')) {
        throw new FestieSchemaError(
          '006_festie_llm_provider',
          'AI model setting is not available yet — run migration 006_festie_llm_provider.sql on the database.',
        );
      }
      throw err;
    }
  }

  if (patch.control_mode !== undefined) {
    try {
      const modeRows = await sql`
        UPDATE festies SET control_mode = ${patch.control_mode}
        WHERE user_id = ${userId}::uuid
        RETURNING *
      `;
      row = rowToFestie(modeRows[0] as Record<string, unknown>);
    } catch (err) {
      if (isMissingColumnError(err, 'control_mode')) {
        throw new FestieSchemaError(
          '022_festie_control_mode',
          'Autopilot setting is not available yet — run migration 022_festie_control_mode.sql on the database.',
        );
      }
      throw err;
    }
  }

  return row;
}

const DIM_WINDOW_HOURS = FESTIE_CONFIG.DIM_WINDOW_MS / (60 * 60 * 1000);

/** Active festie counts per stage (dim window). */
export async function countActiveFestiesByStage(): Promise<Record<string, number>> {
  const sql = requireDb();
  const rows = await sql`
    SELECT stage_slug, COUNT(*)::int AS count
    FROM festies
    WHERE last_seen_at > now() - (${DIM_WINDOW_HOURS}::int * interval '1 hour')
    GROUP BY stage_slug
  `;
  const out: Record<string, number> = {};
  for (const row of rows) {
    const slug = String((row as { stage_slug: string }).stage_slug);
    out[slug] = Number((row as { count: number }).count ?? 0);
  }
  return out;
}

/** All festies assigned to each home stage (fallback when none recently active). */
export async function countAllFestiesByStage(): Promise<Record<string, number>> {
  const sql = requireDb();
  const rows = await sql`
    SELECT stage_slug, COUNT(*)::int AS count
    FROM festies
    GROUP BY stage_slug
  `;
  const out: Record<string, number> = {};
  for (const row of rows) {
    const slug = String((row as { stage_slug: string }).stage_slug);
    out[slug] = Number((row as { count: number }).count ?? 0);
  }
  return out;
}

/** Active festies for a stage (dim window), plus any signed-in owners currently in the room. */
export async function listActiveFestiesForStage(
  stageSlug: string,
  onlineUserIds: string[] = [],
): Promise<FestiePublic[]> {
  const sql = requireDb();
  const online = new Set(onlineUserIds);
  const rows = online.size > 0
    ? await sql`
        SELECT id, user_id, name, preset, attributes, topics, personality_notes, stage_slug, last_seen_at, owner_online, control_mode
        FROM festies
        WHERE last_seen_at > now() - (${DIM_WINDOW_HOURS}::int * interval '1 hour')
          AND (
            stage_slug = ${stageSlug}
            OR user_id = ANY(${[...online]}::uuid[])
          )
        ORDER BY last_seen_at DESC
      `
    : await sql`
        SELECT id, user_id, name, preset, attributes, topics, personality_notes, stage_slug, last_seen_at, owner_online, control_mode
        FROM festies
        WHERE stage_slug = ${stageSlug}
          AND last_seen_at > now() - (${DIM_WINDOW_HOURS}::int * interval '1 hour')
        ORDER BY last_seen_at DESC
      `;

  const byId = new Map<string, FestiePublic>();
  for (const r of rows) {
    const row = rowToFestie({ ...r, last_chat_at: null, created_at: '' });
    const isOnline = online.has(row.user_id);
    const autopilot = isOnline && row.control_mode === 'ai';
    byId.set(row.id, {
      ...toFestiePublic(row),
      control_mode: row.control_mode,
      owner_on_stage: isOnline && !autopilot,
    });
  }
  return [...byId.values()];
}

export async function touchFestieSeen(userId: string): Promise<void> {
  const sql = requireDb();
  await sql`
    UPDATE festies SET last_seen_at = now() WHERE user_id = ${userId}::uuid
  `;
}

export async function dismissFestieHelp(userId: string): Promise<FestieRow | null> {
  const sql = requireDb();
  try {
    const rows = await sql`
      UPDATE festies
      SET help_dismissed_at = now()
      WHERE user_id = ${userId}::uuid
        AND help_dismissed_at IS NULL
      RETURNING *
    `;
    if (rows.length > 0) {
      return rowToFestie(rows[0] as Record<string, unknown>);
    }
    return getFestieByUserId(userId);
  } catch (err) {
    if (isMissingColumnError(err, 'help_dismissed_at')) {
      throw new FestieSchemaError(
        '011_festie_help_dismissed',
        'Help popup is not available yet — run migration 011_festie_help_dismissed.sql on the database.',
      );
    }
    throw err;
  }
}

export async function setFestieOwnerOnline(userId: string, online: boolean): Promise<void> {
  const sql = requireDb();
  await sql`
    UPDATE festies SET owner_online = ${online} WHERE user_id = ${userId}::uuid
  `;
}

/** Offline festies due for one ambient NPC chat (~2h cadence while owner is away). */
export async function listFestiesDueForOfflineNpcChat(limit = 5): Promise<FestieRow[]> {
  const sql = requireDb();
  const chatIntervalSec = Math.floor(FESTIE_CONFIG.OFFLINE_CHAT_INTERVAL_MS / 1000);
  const liveSec = Math.floor(FESTIE_CONFIG.LIVE_WINDOW_MS / 1000);
  const maxChats = FESTIE_CONFIG.MAX_CHATS_PER_OFFLINE_CYCLE;

  const rows = await sql`
    SELECT f.*
    FROM festies f
    WHERE f.owner_online = false
      AND f.last_seen_at > now() - make_interval(secs => ${liveSec})
      AND (
        (f.last_chat_at IS NULL AND f.last_seen_at <= now() - make_interval(secs => ${chatIntervalSec}))
        OR f.last_chat_at <= now() - make_interval(secs => ${chatIntervalSec})
      )
      AND (
        SELECT COUNT(*)::int
        FROM festie_events e
        WHERE e.festie_id = f.id
          AND e.type = 'npc_chatter'
          AND e.created_at >= f.last_seen_at
      ) < ${maxChats}
    ORDER BY COALESCE(f.last_chat_at, f.last_seen_at) ASC
    LIMIT ${limit}
  `;

  return rows.map(r => rowToFestie(r as Record<string, unknown>));
}

export async function getFestieById(festieId: string): Promise<FestieRow | null> {
  const sql = requireDb();
  const rows = await sql`
    SELECT * FROM festies WHERE id = ${festieId}::uuid LIMIT 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  return row ? rowToFestie(row) : null;
}

export async function touchFestieLastChat(festieId: string): Promise<void> {
  const sql = requireDb();
  await sql`
    UPDATE festies SET last_chat_at = now() WHERE id = ${festieId}::uuid
  `;
}

/** LLM chat sessions started since owner went offline (last_seen_at). */
export async function countFestieChatsSince(
  festieId: string,
  since: string,
): Promise<number> {
  const sql = requireDb();
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM festie_conversations
    WHERE festie_id = ${festieId}::uuid
      AND created_at >= ${since}::timestamptz
  `;
  return Number((rows[0] as { count: number }).count ?? 0);
}

type ChatMessage = { role: 'user' | 'assistant'; content: string; at: string };

export async function appendFestieConversation(
  festieId: string,
  playerId: string | null,
  conversationId: string | null,
  entries: ChatMessage[],
): Promise<string> {
  const sql = requireDb();
  if (conversationId) {
    await sql`
      UPDATE festie_conversations
      SET messages = COALESCE(messages, '[]'::jsonb) || ${JSON.stringify(entries)}::jsonb
      WHERE id = ${conversationId}::uuid
    `;
    return conversationId;
  }

  const rows = await sql`
    INSERT INTO festie_conversations (festie_id, player_id, messages)
    VALUES (
      ${festieId}::uuid,
      ${playerId},
      ${JSON.stringify(entries)}::jsonb
    )
    RETURNING id
  `;
  return String((rows[0] as { id: string }).id);
}
