import type { FestiePublic } from '@/lib/festie/types';

function festieStageContext(festie: FestiePublic): string {
  if (festie.owner_on_stage) {
    return `${festie.name} is their human's festie avatar on stage with them right now.`;
  }
  return `${festie.name} is a festival-goer's AI festie — wandering the festival stage while their human is away.`;
}

/** Personality block for ambient NPC / stage / room chatter prompts. */
export function festiePersonalityNotesForNpcChatter(festie: FestiePublic): string {
  const parts = [festieStageContext(festie)];
  const notes = festie.personality_notes?.trim();
  if (notes) {
    parts.push(`Describe ${festie.name}: ${notes}`);
  }
  return parts.join(' ');
}

/** System-prompt section for direct player ↔ festie chat. */
export function festieDescribePromptSection(festie: FestiePublic): string {
  const parts = festie.owner_on_stage
    ? [
      `You are ${festie.name} — your human is here on stage with you right now.`,
      'You are not the human; you are their festie avatar wandering the crowd nearby. Stay in character as their vibe on the street.',
    ]
    : [
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
