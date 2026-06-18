import { festieDescribePromptSection } from '@/lib/festie/describeNotes';
import type { FestiePublic } from '@/lib/festie/types';
import { BASE_NPC_PROMPT } from '@/lib/npcChat';
import { cinemaWorldNote, concertWorldNote } from '@/lib/npcChat';

export function buildFestieSystemPrompt(opts: {
  festie: FestiePublic;
  cinemaNowPlaying?: string | null;
  concertNowPlaying?: string | null;
  conversationSeed?: string | null;
}): string {
  const { festie, cinemaNowPlaying, concertNowPlaying, conversationSeed } = opts;

  const parts = [
    BASE_NPC_PROMPT,
    '',
    festieDescribePromptSection(festie),
    '',
    cinemaWorldNote(cinemaNowPlaying),
    concertWorldNote(concertNowPlaying),
  ];

  if (conversationSeed?.trim()) {
    parts.push(
      '',
      `Conversation hook (weave in naturally if it fits — do not quote verbatim): ${conversationSeed.trim()}`,
    );
  }

  return parts.join('\n');
}
