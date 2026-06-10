import CHARACTERS, { type CharacterDef } from '@/components/game/characters';
import { allGeneratedCharacters } from '@/lib/generatedNpcs';
import { bitcoinWorldNote, formatBitcoinUsd, type BitcoinSnapshot } from '@/lib/bitcoinPrice';

export type ChatTurn = { role: 'user' | 'assistant'; content: string };

export const NPC_CHAT_MODEL = 'gpt-4.1-nano';

/** Minimum time the typing bubble stays visible before the reply appears. */
export const NPC_TYPING_MS = 1400;

/** Shared rules for every NPC conversation. */
export const BASE_NPC_PROMPT = `You are an NPC in WhichStage — a cozy 2D walking game where players explore festival cities and live stages. A player just walked up to chat with you on the street.

Rules:
- Keep replies VERY short: usually one brief sentence, max two short sentences
- Aim for under 12 words when you can — natural, not padded
- Sound like a real person texting: warm, casual, a little imperfect — not a catchphrase machine
- Match your character's personality, but don't perform it every line
- No puns or wordplay unless you are Giggle
- No emojis unless absolutely necessary (almost never)
- A little humor is fine; never lecture or info-dump
- Stay in the world — you're hanging out outside, not an AI assistant
- Never break character or mention being an AI, a model, or a game script`;

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
): string {
  const btcNote =
    character.id === 'satosh' ? `\n${bitcoinWorldNote(bitcoinSnapshot ?? null)}` : '';

  return `${BASE_NPC_PROMPT}

Your name is ${character.name}.
Personality: ${character.personalityNotes}
How you move through the world: ${movementVibe(character)}.
${cinemaWorldNote(cinemaNowPlaying)}
${concertWorldNote(concertNowPlaying)}${btcNote}`;
}

export function pickFallbackReply(
  character: CharacterDef,
  bitcoinSnapshot?: BitcoinSnapshot | null,
): string {
  if (character.id === 'satosh' && bitcoinSnapshot) {
    return `${formatBitcoinUsd(bitcoinSnapshot.usd)} right now — say that again?`;
  }
  return 'Hmm, lost my train of thought — say that again?';
}

export function pickFallbackGreeting(
  character: CharacterDef,
  bitcoinSnapshot?: BitcoinSnapshot | null,
): string {
  if (character.id === 'satosh' && bitcoinSnapshot) {
    const change =
      bitcoinSnapshot.change24hPct != null
        ? `, ${bitcoinSnapshot.change24hPct >= 0 ? 'up' : 'down'} ${Math.abs(bitcoinSnapshot.change24hPct).toFixed(1)}% today`
        : '';
    return `₿ ${formatBitcoinUsd(bitcoinSnapshot.usd)}${change} — what's good?`;
  }
  return `Hey! I'm ${character.name}.`;
}

export function buildGreetingMessages(
  character: CharacterDef,
  playerName: string,
  cinemaNowPlaying?: string | null,
  concertNowPlaying?: string | null,
  bitcoinSnapshot?: BitcoinSnapshot | null,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  return [
    {
      role: 'system',
      content: `${buildNpcSystemPrompt(character, cinemaNowPlaying, concertNowPlaying, bitcoinSnapshot)}

The player just walked up to you on the street to connect. Give a warm in-character greeting — one very short sentence (under 12 words if possible). This is the very start of the conversation.`,
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
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const trimmed = history.slice(-8);
  return [
    {
      role: 'system',
      content: buildNpcSystemPrompt(character, cinemaNowPlaying, concertNowPlaying, bitcoinSnapshot),
    },
    ...trimmed.map(t => ({ role: t.role, content: t.content })),
    {
      role: 'user',
      content: `${playerName} says: ${message}`,
    },
  ];
}
