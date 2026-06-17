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

export async function insertFestieEvent(
  festieId: string,
  type: FestieEventType,
  payload: Record<string, unknown>,
  createdAt?: string,
): Promise<void> {
  const sql = requireDb();
  await sql`
    INSERT INTO festie_events (festie_id, type, payload, created_at)
    VALUES (
      ${festieId}::uuid,
      ${type},
      ${JSON.stringify(payload)}::jsonb,
      ${toIsoTimestamp(createdAt ?? new Date().toISOString())}::timestamptz
    )
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
