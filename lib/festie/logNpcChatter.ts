import {
  FESTIE_EVENT_TYPES,
  insertFestieEvent,
  type FestieNpcChatterPayload,
} from '@/lib/festie/events';

/** Fire-and-forget — ambient festie ↔ NPC pair chatter for session recap. */
export function logFestieNpcChatter(
  festieId: string,
  payload: FestieNpcChatterPayload,
  createdAt?: string,
): void {
  void insertFestieEvent(festieId, FESTIE_EVENT_TYPES.NPC_CHATTER, payload, createdAt).catch(err => {
    console.error('[festie_events] npc_chatter', festieId, err);
  });
}
