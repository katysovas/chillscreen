/**
 * Browser-safe chatter labels — hardcoded cast only.
 * Generated NPC labels use the fallback name + gen- id heuristic (no monolithic JSON).
 */
import CHARACTERS, { type CharacterDef } from '@/components/game/characters';
import { formatNpcBrandedName, npcBrandFromModelId } from '@/lib/npcBrandedName';
import { modelIdForGeneratedNpc } from '@/lib/npcGeneratedModels';

export function wanderingCharacters(): CharacterDef[] {
  return CHARACTERS.filter(c => !c.stageAnchor);
}

export function resolveNpcModelId(ch: CharacterDef): string {
  if (ch.modelId) return ch.modelId;
  return modelIdForGeneratedNpc(ch.id);
}

export function getChatterCharacter(id: string): CharacterDef | undefined {
  return wanderingCharacters().find(c => c.id === id);
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
