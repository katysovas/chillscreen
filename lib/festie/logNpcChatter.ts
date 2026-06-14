import {
  FESTIE_EVENT_TYPES,
  insertFestieEvent,
  type FestieNpcChatterPayload,
} from '@/lib/festie/events';
import { festieIdFromNpcId, isFestieNpcId } from '@/lib/festie/toCharacterDef';
import { resolveNpcRosterEntry } from '@/lib/npcRoster.server';

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

/** Persist LLM pair convo for each festie participant (live or offline backfill). */
export async function logFestiePairChatter(
  npcA: string,
  npcB: string,
  lines: { npc: string; text: string }[],
  createdAt?: string,
): Promise<void> {
  for (const npcId of [npcA, npcB]) {
    if (!isFestieNpcId(npcId)) continue;
    const festieId = festieIdFromNpcId(npcId);
    if (!festieId) continue;

    const partnerId = npcId === npcA ? npcB : npcA;
    const partnerEntry = await resolveNpcRosterEntry(partnerId);
    const festieLines = lines.filter(l => l.npc === npcId);
    const partnerLines = lines.filter(l => l.npc === partnerId);
    if (festieLines.length === 0) continue;

    const payload: FestieNpcChatterPayload = {
      partnerNpcId: partnerId,
      partnerNpcName: partnerEntry?.displayName ?? partnerId,
      festieLine: festieLines.map(l => l.text).join(' '),
      partnerLine: partnerLines.map(l => l.text).join(' '),
      transcript: lines.map(l => ({
        role: l.npc === npcId ? 'festie' : 'partner',
        text: l.text,
      })),
      synthesized: false,
    };

    await insertFestieEvent(
      festieId,
      FESTIE_EVENT_TYPES.NPC_CHATTER,
      payload,
      createdAt,
    );
  }
}
