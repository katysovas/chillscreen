import { FESTIE_CONFIG, festieTier } from '@/lib/festie/config';
import type {
  FestieAttributes,
  FestieOwner,
  FestiePreset,
  FestiePublic,
  FestieRow,
} from '@/lib/festie/types';
import { requireDb } from '@/lib/db';

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
    last_seen_at: String(row.last_seen_at),
    last_chat_at: row.last_chat_at != null ? String(row.last_chat_at) : null,
    notify_email: row.notify_email != null ? String(row.notify_email) : null,
    email_opted_in: Boolean(row.email_opted_in),
    created_at: String(row.created_at),
  };
}

export function toFestieOwner(row: FestieRow): FestieOwner {
  return {
    ...toFestiePublic(row),
    notify_email: row.notify_email,
    email_opted_in: row.email_opted_in,
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
    last_seen_at: row.last_seen_at,
    tier: festieTier(new Date(row.last_seen_at)),
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
  return rowToFestie(rows[0] as Record<string, unknown>);
}

const DIM_WINDOW_HOURS = FESTIE_CONFIG.DIM_WINDOW_MS / (60 * 60 * 1000);

/** Active festies for a stage (dim window), excluding given online user ids. */
export async function listActiveFestiesForStage(
  stageSlug: string,
  excludeUserIds: string[] = [],
): Promise<FestiePublic[]> {
  const sql = requireDb();
  const rows = excludeUserIds.length > 0
    ? await sql`
        SELECT id, name, preset, attributes, topics, personality_notes, stage_slug, last_seen_at
        FROM festies
        WHERE stage_slug = ${stageSlug}
          AND last_seen_at > now() - (${DIM_WINDOW_HOURS}::int * interval '1 hour')
          AND user_id <> ALL(${excludeUserIds}::uuid[])
        ORDER BY last_seen_at DESC
      `
    : await sql`
        SELECT id, name, preset, attributes, topics, personality_notes, stage_slug, last_seen_at
        FROM festies
        WHERE stage_slug = ${stageSlug}
          AND last_seen_at > now() - (${DIM_WINDOW_HOURS}::int * interval '1 hour')
        ORDER BY last_seen_at DESC
      `;

  return rows.map(r => {
    const row = rowToFestie({ ...r, user_id: '', last_chat_at: null, created_at: '' });
    return toFestiePublic(row);
  });
}

export async function touchFestieSeen(userId: string): Promise<void> {
  const sql = requireDb();
  await sql`
    UPDATE festies SET last_seen_at = now() WHERE user_id = ${userId}::uuid
  `;
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
    const rows = await sql`
      SELECT messages FROM festie_conversations WHERE id = ${conversationId}::uuid LIMIT 1
    `;
    const existing = rows[0] as { messages: unknown } | undefined;
    const prior = Array.isArray(existing?.messages) ? existing.messages as ChatMessage[] : [];
    const merged = [...prior, ...entries];
    await sql`
      UPDATE festie_conversations SET messages = ${JSON.stringify(merged)}::jsonb
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
