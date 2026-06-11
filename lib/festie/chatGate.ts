import { FESTIE_CONFIG, festieTier } from '@/lib/festie/config';
import { countFestieChatsSince } from '@/lib/festie/db';
import type { FestieRow } from '@/lib/festie/types';

export type FestieChatGate = {
  useLlm: boolean;
  cannedReply: string | null;
};

const DIM_LINE = 'zoning out rn';

const TALKED_OUT_LINES = [
  'need a minute — talked to too many people already',
  'social battery hit — catch you in a bit',
  'gonna chill for a sec before more chats',
];

function pickTalkedOutLine(festie: FestieRow): string {
  const idx = festie.attributes.chattiness % TALKED_OUT_LINES.length;
  return TALKED_OUT_LINES[idx] ?? TALKED_OUT_LINES[0]!;
}

/** Server-side gate for offline festie 1:1 chat (tier + rate + cap). */
export async function evaluateFestieChatGate(festie: FestieRow): Promise<FestieChatGate> {
  const tier = festieTier(new Date(festie.last_seen_at));

  if (tier === 'dim') {
    return { useLlm: false, cannedReply: DIM_LINE };
  }

  if (tier !== 'live') {
    return { useLlm: false, cannedReply: DIM_LINE };
  }

  const chatCount = await countFestieChatsSince(festie.id, festie.last_seen_at);
  if (chatCount >= FESTIE_CONFIG.MAX_CHATS_PER_OFFLINE_CYCLE) {
    return { useLlm: false, cannedReply: pickTalkedOutLine(festie) };
  }

  if (festie.last_chat_at) {
    const sinceChat = Date.now() - new Date(festie.last_chat_at).getTime();
    if (sinceChat < FESTIE_CONFIG.OFFLINE_CHAT_INTERVAL_MS) {
      return { useLlm: false, cannedReply: pickTalkedOutLine(festie) };
    }
  }

  return { useLlm: true, cannedReply: null };
}
