import { trackNpcChatterLine } from '@/lib/analytics';
import { isFestieNpcId } from '@/lib/festie/toCharacterDef';

export function trackAmbientNpcChatter(
  npcId: string,
  text: string,
  kind: 'pair' | 'solo',
  opts: {
    convoId?: string;
    stage?: string;
    npcName?: string;
  } = {},
): void {
  trackNpcChatterLine({
    npcId,
    npcName: opts.npcName ?? npcId,
    text,
    kind,
    convoId: opts.convoId,
    stage: opts.stage,
    isFestie: isFestieNpcId(npcId),
  });
}

export function trackPlayerNpcChatLine(
  npcId: string,
  text: string,
  opts: {
    npcName?: string;
    stage?: string;
    playerName?: string;
    conversationId?: string | null;
  } = {},
): void {
  trackNpcChatterLine({
    npcId,
    npcName: opts.npcName ?? npcId,
    text,
    kind: 'player_chat',
    convoId: opts.conversationId ?? undefined,
    stage: opts.stage,
    playerName: opts.playerName,
    isFestie: isFestieNpcId(npcId),
  });
}
