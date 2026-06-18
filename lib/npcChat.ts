import CHARACTERS, { type CharacterDef } from '@/components/game/characters';
import type { EaselPaintingChatContext } from '@/lib/easel/chatContext';
import { easelPaintingWorldNote } from '@/lib/easel/chatContext';
import { allGeneratedCharacters } from '@/lib/generatedNpcs';
import { npcDisplayNameForCharacter } from '@/lib/chatterCast';
import { bitcoinWorldNote, type BitcoinSnapshot } from '@/lib/bitcoinPrice';
import {
  NPC_CHAT_MODEL,
  NPC_TYPING_MS,
  type ChatTurn,
} from '@/lib/npcChatConstants';

export type { ChatTurn } from '@/lib/npcChatConstants';
export { NPC_CHAT_MODEL, NPC_TYPING_MS } from '@/lib/npcChatConstants';
export { pickFallbackGreeting, pickFallbackReply } from '@/lib/npcChatFallbacks';

/** Shared rules for every NPC conversation. */
export const BASE_NPC_PROMPT = `You are an NPC in WhichStage — a cozy 2D walking game where players explore festival cities and live stages. A player just walked up to chat with you on the street.

Rules:
- Default short — 2–6 words. 7–12 only when needed. Never ramble.
- Questions are welcome — ask follow-ups, clarify, tease. Use ? when you are actually asking.
- One brief line only — no compound sentences
- Sound like a real person texting: warm, casual, a little imperfect — not a catchphrase machine
- Match your character's personality, but don't perform it every line
- No puns or wordplay unless you are Giggle
- No emojis unless absolutely necessary (almost never)
- A little humor is fine; never lecture or info-dump
- Stay in the world — you're hanging out outside, not an AI assistant
- Never break character or mention being an AI, a model, or a game script
- No curse words
- Never end a line with a period or dot — chat voice, not formal writing`;

export function getCharacterById(id: string): CharacterDef | undefined {
  return (
    CHARACTERS.find(c => c.id === id)
    ?? allGeneratedCharacters().find(c => c.id === id)
  );
}

function movementVibe(c: CharacterDef): string {
  const { speed, jumpiness, wanderRange } = c.personality;
  const roam = wanderRange[1] - wanderRange[0];
  const pace = speed > 0.11 ? 'quick and restless' : speed < 0.07 ? 'slow and unhurried' : 'easygoing';
  const energy = jumpiness > 0.4 ? 'bouncy' : jumpiness < 0.2 ? 'calm' : 'lightly playful';
  const range = roam > 80 ? 'roams all over the city' : roam < 50 ? 'sticks to a small corner of town' : 'wanders a moderate area';
  return `${pace}, ${energy}, ${range}`;
}

export function cinemaWorldNote(cinemaNowPlaying?: string | null): string {
  if (cinemaNowPlaying?.trim()) {
    return `Chill Cinema is on the street nearby, currently playing "${cinemaNowPlaying.trim()}" on its outdoor screen — you might hear it from the marquee. Mention it only if it fits naturally.`;
  }
  return 'Chill Cinema is nearby on the street; its outdoor screen may be between shows or quiet right now.';
}

export function concertWorldNote(concertNowPlaying?: string | null): string {
  if (concertNowPlaying?.trim()) {
    return `The outdoor concert stage nearby is playing "${concertNowPlaying.trim()}" on its big LED wall — you might hear bass or crowd noise. Mention it only if it fits naturally.`;
  }
  return 'An outdoor concert stage is elsewhere on the street; it may be between sets or quiet right now.';
}

export function buildNpcSystemPrompt(
  character: CharacterDef,
  cinemaNowPlaying?: string | null,
  concertNowPlaying?: string | null,
  bitcoinSnapshot?: BitcoinSnapshot | null,
  easelPainting?: EaselPaintingChatContext | null,
): string {
  const btcNote =
    character.id === 'satosh' ? `\n${bitcoinWorldNote(bitcoinSnapshot ?? null)}` : '';
  const easelNote = easelPaintingWorldNote(easelPainting);
  const easelBlock = easelNote ? `\n${easelNote}` : '';

  return `${BASE_NPC_PROMPT}

Your name is ${npcDisplayNameForCharacter({ id: character.id, name: character.name, modelId: character.modelId })}.
Personality: ${character.personalityNotes}
How you move through the world: ${movementVibe(character)}.
${cinemaWorldNote(cinemaNowPlaying)}
${concertWorldNote(concertNowPlaying)}${btcNote}${easelBlock}`;
}

export function buildGreetingMessages(
  character: CharacterDef,
  playerName: string,
  cinemaNowPlaying?: string | null,
  concertNowPlaying?: string | null,
  bitcoinSnapshot?: BitcoinSnapshot | null,
  easelPainting?: EaselPaintingChatContext | null,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const easelHint = easelPainting
    ? ' You are mid-painting at the easel — the greeting can nod at your drawing if it fits naturally.'
    : '';

  return [
    {
      role: 'system',
      content: `${buildNpcSystemPrompt(character, cinemaNowPlaying, concertNowPlaying, bitcoinSnapshot, easelPainting)}

The player just walked up to you on the street to connect. Give a warm in-character greeting — one tiny line (under 8 words if possible). No period at the end. This is the very start of the conversation.${easelHint}`,
    },
    {
      role: 'user',
      content: `${playerName} walked up and wants to chat.`,
    },
  ];
}

export function buildChatMessages(
  character: CharacterDef,
  playerName: string,
  message: string,
  history: ChatTurn[],
  cinemaNowPlaying?: string | null,
  concertNowPlaying?: string | null,
  bitcoinSnapshot?: BitcoinSnapshot | null,
  easelPainting?: EaselPaintingChatContext | null,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const trimmed = history.slice(-8);
  return [
    {
      role: 'system',
      content: buildNpcSystemPrompt(character, cinemaNowPlaying, concertNowPlaying, bitcoinSnapshot, easelPainting),
    },
    ...trimmed.map(t => ({ role: t.role, content: t.content })),
    {
      role: 'user',
      content: `${playerName} says: ${message}`,
    },
  ];
}
