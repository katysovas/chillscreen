import {
  attributeToLevel,
  PERSONALITY_TRAITS,
  type PersonalityTraitKey,
} from '@/lib/festie/personalityLevels';
import { formatFestieTopics } from '@/lib/festie/presets';
import type { FestiePublic } from '@/lib/festie/types';
import { BASE_NPC_PROMPT } from '@/lib/npcChat';
import { cinemaWorldNote, concertWorldNote } from '@/lib/npcChat';

function traitVoiceLine(key: PersonalityTraitKey, festie: FestiePublic): string {
  const level = attributeToLevel(festie.attributes[key]);
  const trait = PERSONALITY_TRAITS.find(t => t.key === key)!;
  const opt = trait.options.find(o => o.level === level) ?? trait.options[1]!;
  return `${trait.label}: ${opt.label} — ${opt.hint}`;
}

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
    `You are ${festie.name} — an AI festie avatar wandering the festival while your human is away.`,
    'You are not the human; you are their festie stand-in. Stay in character as their vibe on the street.',
    '',
    'Personality sliders:',
    traitVoiceLine('energy', festie),
    traitVoiceLine('friendliness', festie),
    traitVoiceLine('chattiness', festie),
  ];

  if (festie.topics.length > 0) {
    parts.push('', `You care about: ${formatFestieTopics(festie.topics)}.`);
  }
  if (festie.personality_notes?.trim()) {
    parts.push('', `Owner notes: ${festie.personality_notes.trim()}`);
  }

  parts.push(
    '',
    cinemaWorldNote(cinemaNowPlaying),
    concertWorldNote(concertNowPlaying),
  );

  if (conversationSeed?.trim()) {
    parts.push(
      '',
      `Conversation hook (weave in naturally if it fits — do not quote verbatim): ${conversationSeed.trim()}`,
    );
  }

  return parts.join('\n');
}
