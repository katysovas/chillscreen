import { requireDb } from '@/lib/db';
import { toIsoTimestamp } from '@/lib/timestamps';

export const FESTIE_EVENT_TYPES = {
  CHAT: 'chat',
  COIN_PICKUP: 'coin_pickup',
  OWNER_LEAVE: 'owner_leave',
} as const;

export type FestieEventType = typeof FESTIE_EVENT_TYPES[keyof typeof FESTIE_EVENT_TYPES];

export type FestieEventRow = {
  id: number;
  festie_id: string;
  type: FestieEventType;
  payload: Record<string, unknown>;
  created_at: string;
};

export type FestieChatEventPayload = {
  playerName: string;
  playerId?: string | null;
  isGreeting: boolean;
  userMessage?: string | null;
  reply: string;
  conversationId?: string | null;
  llm: boolean;
};

export type FestieCoinPickupPayload = {
  amount: number;
  balance: number;
};

export type FestieOwnerLeavePayload = {
  stage_slug: string;
};

function rowToEvent(row: Record<string, unknown>): FestieEventRow {
  const payload = row.payload;
  return {
    id: Number(row.id),
    festie_id: String(row.festie_id),
    type: String(row.type) as FestieEventType,
    payload: (typeof payload === 'object' && payload !== null
      ? payload
      : {}) as Record<string, unknown>,
    created_at: toIsoTimestamp(row.created_at),
  };
}

export async function insertFestieEvent(
  festieId: string,
  type: FestieEventType,
  payload: Record<string, unknown>,
): Promise<void> {
  const sql = requireDb();
  await sql`
    INSERT INTO festie_events (festie_id, type, payload)
    VALUES (${festieId}::uuid, ${type}, ${JSON.stringify(payload)}::jsonb)
  `;
}

/** Fire-and-forget — never blocks chat/coin responses on logging failures. */
export function logFestieEvent(
  festieId: string,
  type: FestieEventType,
  payload: Record<string, unknown>,
): void {
  void insertFestieEvent(festieId, type, payload).catch(err => {
    console.error('[festie_events]', type, festieId, err);
  });
}

export async function listFestieEventsSince(
  festieId: string,
  since: string,
  opts?: { until?: string; limit?: number },
): Promise<FestieEventRow[]> {
  const sql = requireDb();
  const limit = opts?.limit ?? 200;
  const sinceIso = toIsoTimestamp(since);
  const untilIso = opts?.until ? toIsoTimestamp(opts.until) : undefined;

  const rows = untilIso
    ? await sql`
        SELECT id, festie_id, type, payload, created_at
        FROM festie_events
        WHERE festie_id = ${festieId}::uuid
          AND created_at >= ${sinceIso}::timestamptz
          AND created_at < ${untilIso}::timestamptz
        ORDER BY created_at ASC
        LIMIT ${limit}
      `
    : await sql`
        SELECT id, festie_id, type, payload, created_at
        FROM festie_events
        WHERE festie_id = ${festieId}::uuid
          AND created_at >= ${sinceIso}::timestamptz
        ORDER BY created_at ASC
        LIMIT ${limit}
      `;
  return rows.map(r => rowToEvent(r as Record<string, unknown>));
}

export async function sumFestieCoinsSince(
  festieId: string,
  since: string,
  until?: string,
): Promise<number> {
  const sql = requireDb();
  const sinceIso = toIsoTimestamp(since);
  const untilIso = until ? toIsoTimestamp(until) : undefined;
  const rows = untilIso
    ? await sql`
        SELECT COALESCE(SUM((payload->>'amount')::int), 0)::int AS total
        FROM festie_events
        WHERE festie_id = ${festieId}::uuid
          AND type = ${FESTIE_EVENT_TYPES.COIN_PICKUP}
          AND created_at >= ${sinceIso}::timestamptz
          AND created_at < ${untilIso}::timestamptz
      `
    : await sql`
        SELECT COALESCE(SUM((payload->>'amount')::int), 0)::int AS total
        FROM festie_events
        WHERE festie_id = ${festieId}::uuid
          AND type = ${FESTIE_EVENT_TYPES.COIN_PICKUP}
          AND created_at >= ${sinceIso}::timestamptz
      `;
  return Number((rows[0] as { total: number }).total ?? 0);
}

export function isRecapDisplayEvent(event: FestieEventRow): boolean {
  return event.type === FESTIE_EVENT_TYPES.CHAT
    || event.type === FESTIE_EVENT_TYPES.COIN_PICKUP;
}

export function hasRecapContent(events: FestieEventRow[]): boolean {
  return events.some(isRecapDisplayEvent);
}

export function countFestieChatsInEvents(events: FestieEventRow[]): number {
  return events.filter(e => e.type === FESTIE_EVENT_TYPES.CHAT).length;
}
