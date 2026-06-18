import type { FestiePublic } from '@/lib/festie/types';

const AWAY_CONTEXT =
  "wandering the festival stage while their human is away";

/** Personality block for ambient NPC / stage / room chatter prompts. */
export function festiePersonalityNotesForNpcChatter(festie: FestiePublic): string {
  const parts = [
    `${festie.name} is a festival-goer's AI festie — ${AWAY_CONTEXT}.`,
  ];
  const notes = festie.personality_notes?.trim();
  if (notes) {
    parts.push(`Describe ${festie.name}: ${notes}`);
  }
  return parts.join(' ');
}

/** System-prompt section for direct player ↔ festie chat. */
export function festieDescribePromptSection(festie: FestiePublic): string {
  const parts = [
    `You are ${festie.name} — an AI festie avatar wandering the festival while your human is away.`,
    'You are not the human; you are their festie stand-in. Stay in character as their vibe on the street.',
  ];
  const notes = festie.personality_notes?.trim();
  if (notes) {
    parts.push('', `Describe ${festie.name}: ${notes}`);
  } else {
    parts.push(
      '',
      `No owner description yet — keep it chill, festival-forward, and in character as ${festie.name}'s stand-in.`,
    );
  }
  return parts.join('\n');
}
