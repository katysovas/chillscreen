'use client';

import type { CharacterDef } from '@/components/game/characters';
import type { ChatLine } from '@/lib/chatLines';
import { AMBIENT_CHAT_ENABLED } from '@/lib/ambientChatEnabled';

export type NpcAmbientChatState = {
  messages: ChatLine[];
};

/** NPC self-talk — disabled via AMBIENT_CHAT_ENABLED. */
export function useNpcAmbientChat(npcCast: CharacterDef[], _paused: boolean): NpcAmbientChatState[] {
  if (!AMBIENT_CHAT_ENABLED) {
    return npcCast.map(() => ({ messages: [] }));
  }
  return npcCast.map(() => ({ messages: [] }));
}
