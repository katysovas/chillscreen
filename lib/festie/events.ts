import { requireDb } from '@/lib/db';
import { toIsoTimestamp } from '@/lib/timestamps';

export const FESTIE_EVENT_TYPES = {
  CHAT: 'chat',
  NPC_CHATTER: 'npc_chatter',
  LIFE_LOG: 'life_log',
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

/** Ambient festie ↔ NPC pair chatter (live or synthesized while owner away). */
export type FestieNpcChatterPayload = {
  partnerNpcId: string;
  partnerNpcName: string;
  festieLine: string;
  partnerLine: string;
  /** Turn order for recap chat UI — `festie` is the logged-in owner's festie. */
  transcript?: { role: 'festie' | 'partner'; text: string }[];
  synthesized?: boolean;
};

export type FestieOwnerLeavePayload = {
  stage_slug: string;
};

export type LifeLogKind =
  | 'overheard'
  | 'stream_watched'
  | 'presence'
  | 'npc_coins'
  | 'lost_item'
  | 'failed_plan'
  | 'scenery'
  | 'food_incident'
  | 'npc_interaction'
  | 'greg_sighting'
  | 'nap'
  | 'trade'
  | 'mystery'
  | 'crowd_milestone'
  | 'animal'
  | 'lost_found'
  | 'dance'
  | 'queue'
  | 'weather'
  | 'merch'
  | 'sound_check'
  | 'wandering'
  | 'collection';

export type FestieLifeLogPayload = {
  kind: LifeLogKind;
  text: string;
  synthesized?: boolean;
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
  createdAt?: string,
): Promise<void> {
  const sql = requireDb();
  const at = createdAt ? toIsoTimestamp(createdAt) : undefined;
  if (at) {
    await sql`
      INSERT INTO festie_events (festie_id, type, payload, created_at)
      VALUES (${festieId}::uuid, ${type}, ${JSON.stringify(payload)}::jsonb, ${at}::timestamptz)
    `;
    return;
  }
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
    || event.type === FESTIE_EVENT_TYPES.NPC_CHATTER
    || event.type === FESTIE_EVENT_TYPES.LIFE_LOG
    || event.type === FESTIE_EVENT_TYPES.COIN_PICKUP;
}

export function hasRecapContent(events: FestieEventRow[]): boolean {
  return events.some(isRecapDisplayEvent);
}

/** Show session recap only after a meaningful away period — more than 3 activity logs. */
export const SESSION_RECAP_MIN_EVENT_COUNT = 3;

export function hasEnoughRecapEvents(events: FestieEventRow[]): boolean {
  const count = events.filter(isRecapDisplayEvent).length;
  return count > SESSION_RECAP_MIN_EVENT_COUNT;
}

export function countFestieChatsInEvents(events: FestieEventRow[]): number {
  return events.filter(e =>
    e.type === FESTIE_EVENT_TYPES.CHAT
    || e.type === FESTIE_EVENT_TYPES.NPC_CHATTER,
  ).length;
}

export async function countFestieNpcChatterSince(
  festieId: string,
  since: string,
): Promise<number> {
  const sql = requireDb();
  const sinceIso = toIsoTimestamp(since);
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM festie_events
    WHERE festie_id = ${festieId}::uuid
      AND type = ${FESTIE_EVENT_TYPES.NPC_CHATTER}
      AND created_at >= ${sinceIso}::timestamptz
  `;
  return Number((rows[0] as { count: number }).count ?? 0);
}

export async function countSynthesizedLifeLogsSince(
  festieId: string,
  since: string,
): Promise<number> {
  const sql = requireDb();
  const sinceIso = toIsoTimestamp(since);
  const rows = await sql`
    SELECT COUNT(*)::int AS count
    FROM festie_events
    WHERE festie_id = ${festieId}::uuid
      AND type = ${FESTIE_EVENT_TYPES.LIFE_LOG}
      AND payload->>'synthesized' = 'true'
      AND created_at >= ${sinceIso}::timestamptz
  `;
  return Number((rows[0] as { count: number }).count ?? 0);
}

export async function hasLifeLogKindSince(
  festieId: string,
  since: string,
  kind: LifeLogKind,
): Promise<boolean> {
  const sql = requireDb();
  const sinceIso = toIsoTimestamp(since);
  const rows = await sql`
    SELECT 1
    FROM festie_events
    WHERE festie_id = ${festieId}::uuid
      AND type = ${FESTIE_EVENT_TYPES.LIFE_LOG}
      AND payload->>'kind' = ${kind}
      AND created_at >= ${sinceIso}::timestamptz
    LIMIT 1
  `;
  return rows.length > 0;
}
