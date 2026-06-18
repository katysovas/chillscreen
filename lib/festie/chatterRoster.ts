import { formatNpcBrandedName, npcBrandFromModelId } from '@/lib/npcBrandedName';
import type { NpcRosterEntry } from '@/lib/chatterCast';
import { festiePersonalityNotesForNpcChatter } from '@/lib/festie/describeNotes';
import { festieModelIdForProvider } from '@/lib/festie/llmProviders';
import { festieNpcId } from '@/lib/festie/toCharacterDef';
import type { FestiePublic } from '@/lib/festie/types';

/** Roster entry for ambient NPC pair chatter — not gated by festie life tier. */
export function festieToRosterEntry(festie: FestiePublic): NpcRosterEntry {
  const modelId = festieModelIdForProvider(festie.llm_provider);
  return {
    id: festieNpcId(festie.id),
    displayName: festie.name,
    modelId,
    modelDisplayName: npcBrandFromModelId(modelId),
    personalityNotes: festiePersonalityNotesForNpcChatter(festie),
    ownerOnStage: festie.owner_on_stage,
    autopilotActive: festie.control_mode === 'ai',
    describeNotes: festie.personality_notes?.trim() || null,
  };
}

export function festieChatterLabel(festie: FestiePublic): string {
  const modelId = festieModelIdForProvider(festie.llm_provider);
  return formatNpcBrandedName(festie.name, { modelId });
}
