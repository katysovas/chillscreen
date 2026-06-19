import { requireDb } from '@/lib/db';
import { toIsoTimestamp } from '@/lib/timestamps';
import { normalizeBlockValue } from './normalize';
import { isBlockedByList, type BlockCheckInput } from './blocklistCheck';
import type { ChatAccountRow, ModerationBlock, ModerationBlockKind } from './types';

export type { BlockCheckInput };
export { isBlockedByList };

function rowToBlock(row: Record<string, unknown>): ModerationBlock {
  return {
    id: Number(row.id),
    kind: String(row.kind) as ModerationBlockKind,
    value: String(row.value),
    note: row.note != null ? String(row.note) : null,
    created_at: toIsoTimestamp(row.created_at),
  };
}

export async function listModerationBlocks(): Promise<ModerationBlock[]> {
  const sql = requireDb();
  const rows = await sql`
    SELECT * FROM moderation_blocks ORDER BY created_at DESC
  ` as Record<string, unknown>[];
  return rows.map(rowToBlock);
}

export async function addModerationBlock(
  kind: ModerationBlockKind,
  value: string,
  note?: string | null,
): Promise<ModerationBlock> {
  const sql = requireDb();
  const normalized = normalizeBlockValue(kind, value);
  const rows = await sql`
    INSERT INTO moderation_blocks (kind, value, note)
    VALUES (${kind}, ${normalized}, ${note?.trim() || null})
    ON CONFLICT (kind, value) DO UPDATE SET
      note = COALESCE(EXCLUDED.note, moderation_blocks.note)
    RETURNING *
  ` as Record<string, unknown>[];
  return rowToBlock(rows[0]!);
}

export async function removeModerationBlock(id: number): Promise<boolean> {
  const sql = requireDb();
  const rows = await sql`
    DELETE FROM moderation_blocks WHERE id = ${id} RETURNING id
  `;
  return rows.length > 0;
}

export async function listChatAccounts(): Promise<ChatAccountRow[]> {
  const sql = requireDb();
  const blocks = await listModerationBlocks();
  const blockedUserIds = new Set(
    blocks.filter(b => b.kind === 'user_id').map(b => b.value.toLowerCase()),
  );

  const rows = await sql`
    SELECT
      u.id AS user_id,
      f.name AS festie_name,
      f.stage_slug,
      u.created_at,
      COUNT(DISTINCT fc.id)::int AS conversation_sessions,
      MAX(fc.created_at) AS last_chat_at
    FROM users u
    LEFT JOIN festies f ON f.user_id = u.id
    LEFT JOIN festie_conversations fc ON fc.player_id = u.id
    GROUP BY u.id, f.name, f.stage_slug, u.created_at
    HAVING COUNT(fc.id) > 0 OR f.id IS NOT NULL
    ORDER BY MAX(fc.created_at) DESC NULLS LAST, u.created_at DESC
  ` as Record<string, unknown>[];

  return rows.map(row => {
    const userId = String(row.user_id);
    return {
      user_id: userId,
      festie_name: row.festie_name != null ? String(row.festie_name) : null,
      stage_slug: row.stage_slug != null ? String(row.stage_slug) : null,
      created_at: toIsoTimestamp(row.created_at),
      conversation_sessions: Number(row.conversation_sessions ?? 0),
      last_chat_at: row.last_chat_at != null ? toIsoTimestamp(row.last_chat_at) : null,
      blocked: blockedUserIds.has(userId.toLowerCase()),
    };
  });
}

export async function isBlocked(input: BlockCheckInput): Promise<boolean> {
  const blocks = await listModerationBlocks();
  return isBlockedByList(blocks, input);
}

/** Delete festie account + chats; cascades festie, stages, reset tokens. */
export async function deleteUserAccount(userId: string): Promise<boolean> {
  const sql = requireDb();
  const festieRows = await sql`
    SELECT id FROM festies WHERE user_id = ${userId}::uuid
  ` as { id: string }[];
  const festieIds = festieRows.map(r => r.id);

  if (festieIds.length > 0) {
    await sql`
      DELETE FROM festie_conversations
      WHERE player_id = ${userId}::uuid
         OR festie_id = ANY(${festieIds}::uuid[])
    `;
  } else {
    await sql`
      DELETE FROM festie_conversations WHERE player_id = ${userId}::uuid
    `;
  }

  const rows = await sql`
    DELETE FROM users WHERE id = ${userId}::uuid RETURNING id
  `;
  return rows.length > 0;
}
