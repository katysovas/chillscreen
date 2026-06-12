import { formatNpcBrandedName, npcBrandFromModelId } from '@/lib/npcBrandedName';
import type { NpcRosterEntry } from '@/lib/chatterCast';
import { festieModelIdForProvider } from '@/lib/festie/llmProviders';
import { formatFestieTopics } from '@/lib/festie/presets';
import { festieNpcId } from '@/lib/festie/toCharacterDef';
import type { FestiePublic } from '@/lib/festie/types';

function festieChatterPersonality(festie: FestiePublic): string {
  const parts = [
    `${festie.name} is a festival-goer's AI festie — wandering the stage while they're away.`,
  ];
  if (festie.personality_notes?.trim()) {
    parts.push(festie.personality_notes.trim());
  }
  if (festie.topics.length > 0) {
    parts.push(`Into: ${formatFestieTopics(festie.topics)}.`);
  }
  return parts.join(' ');
}

/** Roster entry for ambient NPC pair chatter — not gated by festie life tier. */
export function festieToRosterEntry(festie: FestiePublic): NpcRosterEntry {
  const modelId = festieModelIdForProvider(festie.llm_provider);
  return {
    id: festieNpcId(festie.id),
    displayName: festie.name,
    modelId,
    modelDisplayName: npcBrandFromModelId(modelId),
    personalityNotes: festieChatterPersonality(festie),
  };
}

export function festieChatterLabel(festie: FestiePublic): string {
  const modelId = festieModelIdForProvider(festie.llm_provider);
  return formatNpcBrandedName(festie.name, { modelId });
}
