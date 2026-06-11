/**
 * Single source for chatter-eligible NPCs — hardcoded wandering cast + generated crowds.
 * Replaces data/npc-roster.json and data/npc-roster-public.json.
 */
import CHARACTERS, { type CharacterDef } from '@/components/game/characters';
import { allGeneratedCharacters, generatedCharactersForChannel } from '@/lib/generatedNpcs';
import { formatNpcBrandedName, npcBrandFromModelId } from '@/lib/npcBrandedName';
import { modelIdForGeneratedNpc } from '@/lib/npcGeneratedModels';
import { stageChannelForRoute } from '@/lib/isolatedCity';
import type { StageChannel } from '@/lib/stageVideos';
import type { VenueRoute } from '@/lib/venueSlugs';

export type NpcRosterEntry = {
  id: string;
  displayName: string;
  modelId?: string;
  modelDisplayName?: string;
  personalityNotes: string;
};

/** Wandering cast — excludes stage vendors (Buz carts). */
export function wanderingCharacters(): CharacterDef[] {
  return CHARACTERS.filter(c => !c.stageAnchor);
}

export function resolveNpcModelId(ch: CharacterDef): string {
  if (ch.modelId) return ch.modelId;
  return modelIdForGeneratedNpc(ch.id);
}

export function characterToRosterEntry(ch: CharacterDef): NpcRosterEntry {
  const modelId = resolveNpcModelId(ch);
  return {
    id: ch.id,
    displayName: ch.name,
    modelId,
    modelDisplayName: npcBrandFromModelId(modelId),
    personalityNotes: ch.personalityNotes,
  };
}

export function getChatterCharacter(id: string): CharacterDef | undefined {
  return (
    wanderingCharacters().find(c => c.id === id)
    ?? allGeneratedCharacters().find(c => c.id === id)
  );
}

export function getNpcRosterEntry(id: string): NpcRosterEntry | undefined {
  const ch = getChatterCharacter(id);
  return ch ? characterToRosterEntry(ch) : undefined;
}

export function isChatterNpc(id: string): boolean {
  return getChatterCharacter(id) != null;
}

/** Fallback chatter ids when a venue has no generated crowd. */
export function chatterNpcIds(): string[] {
  return wanderingCharacters().map(c => c.id);
}

export function chatterNpcIdsForChannel(channel: StageChannel): string[] {
  const generated = generatedCharactersForChannel(channel);
  if (generated.length >= 2) return generated.map(c => c.id);
  return chatterNpcIds();
}

export function chatterNpcIdsForRoute(route: VenueRoute): string[] {
  return chatterNpcIdsForChannel(stageChannelForRoute(route));
}

export function npcChatLabel(ch: CharacterDef): string {
  return formatNpcBrandedName(ch.name, { modelId: resolveNpcModelId(ch) });
}

export function npcChatLabelForId(npcId: string, fallbackName: string): string {
  const ch = getChatterCharacter(npcId);
  if (ch) return npcChatLabel(ch);
  if (npcId.startsWith('gen-')) {
    return formatNpcBrandedName(fallbackName, { modelId: modelIdForGeneratedNpc(npcId) });
  }
  return formatNpcBrandedName(fallbackName);
}

export function npcDisplayNameForCharacter(character: { id: string; name: string; modelId?: string }): string {
  if (character.modelId) {
    return formatNpcBrandedName(character.name, { modelId: character.modelId });
  }
  return npcChatLabelForId(character.id, character.name);
}
