import { FESTIE_CONFIG } from '@/lib/festie/config';
import { buildFestieSystemPrompt } from '@/lib/festie/chatPrompt';
import type { FestiePublic } from '@/lib/festie/types';
import type { ChatTurn } from '@/lib/npcChat';

export function pickFestieFallbackGreeting(festie: FestiePublic): string {
  const level = festie.attributes.chattiness;
  if (level <= 3) return `hey — i'm ${festie.name}'s festie.`;
  if (level >= 8) return `oh hey! ${festie.name} is around somewhere but i'm holding down the vibe.`;
  return `hey! i'm ${festie.name}'s festie — what's good?`;
}

export function pickFestieFallbackReply(festie: FestiePublic): string {
  if (festie.attributes.chattiness <= 3) return 'mm — say that again?';
  return 'lost the thread — what were we on?';
}

export function buildFestieGreetingMessages(
  festie: FestiePublic,
  playerName: string,
  cinemaNowPlaying?: string | null,
  concertNowPlaying?: string | null,
  conversationSeed?: string | null,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  return [
    {
      role: 'system',
      content: `${buildFestieSystemPrompt({
        festie,
        cinemaNowPlaying,
        concertNowPlaying,
        conversationSeed,
      })}

The player walked up to chat. Give a warm in-character greeting — one very short sentence (under 12 words if possible).`,
    },
    {
      role: 'user',
      content: `${playerName} walked up and wants to chat.`,
    },
  ];
}

export function buildFestieChatMessages(
  festie: FestiePublic,
  playerName: string,
  message: string,
  history: ChatTurn[],
  cinemaNowPlaying?: string | null,
  concertNowPlaying?: string | null,
  conversationSeed?: string | null,
): Array<{ role: 'system' | 'user' | 'assistant'; content: string }> {
  const trimmed = history.slice(-(FESTIE_CONFIG.MAX_TURNS_PER_CHAT * 2));
  return [
    {
      role: 'system',
      content: buildFestieSystemPrompt({
        festie,
        cinemaNowPlaying,
        concertNowPlaying,
        conversationSeed: history.length === 0 ? conversationSeed : null,
      }),
    },
    ...trimmed.map(t => ({ role: t.role, content: t.content })),
    {
      role: 'user',
      content: `${playerName} says: ${message}`,
    },
  ];
}

export function festieChatTurnLimitReached(history: ChatTurn[]): boolean {
  const userTurns = history.filter(t => t.role === 'user').length;
  return userTurns >= FESTIE_CONFIG.MAX_TURNS_PER_CHAT;
}
