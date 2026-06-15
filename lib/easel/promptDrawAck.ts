import type { CharacterDef } from '@/components/game/characters';

const PROMPT_DRAW_ACKS = [
  'ok give me a min',
  'on it — one sec',
  'yeah hang on',
  'sure, one moment',
  'got it, gimme a sec',
  'ok ok, working on it',
];

function ackIndex(seed: string, len: number): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h) % len;
}

/** Short in-character ack before a chat-prompted drawing starts. */
export function pickPromptDrawAck(character: CharacterDef, subject: string): string {
  void subject;
  const seed = `${character.id}:${Date.now() >> 12}`;
  return PROMPT_DRAW_ACKS[ackIndex(seed, PROMPT_DRAW_ACKS.length)]!;
}

/** Beat after the ack bubble before chat closes and drawing begins. */
export const PROMPT_DRAW_ACK_HOLD_MS = 720;
