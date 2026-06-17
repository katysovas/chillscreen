import { stripNpcChatterDots } from '@/lib/messageFilter';
import type { RoomChatLine } from './prompts';

function normalizeNpcChatterText(text: string): string {
  return stripNpcChatterDots(text).toLowerCase();
}

export function isDuplicateNpcChatterText(
  npcId: string,
  text: string,
  recent: Array<{ sender: string; text: string }>,
): boolean {
  const norm = normalizeNpcChatterText(text);
  const sender = `npc:${npcId}`;
  return recent.some(line => {
    if (line.sender !== sender) return false;
    return normalizeNpcChatterText(line.text) === norm;
  });
}

export function roomLinesForNpcDedup(
  npcId: string,
  recentChat: RoomChatLine[],
  transcript: Array<{ npc: string; text: string }> = [],
): Array<{ sender: string; text: string }> {
  return [
    ...recentChat,
    ...transcript.map(t => ({ sender: `npc:${t.npc}`, text: t.text })),
  ];
}
