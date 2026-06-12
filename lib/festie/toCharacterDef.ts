import type { CharacterDef } from '@/components/game/characters';
import type { Personality } from '@/components/game/NPC';
import { festieModelIdForProvider } from '@/lib/festie/llmProviders';
import { festiePresetById, formatFestieTopics } from '@/lib/festie/presets';
import type { FestieAttributes, FestiePublic } from '@/lib/festie/types';
import { stageAnchorForRoute } from '@/lib/isolatedCity';
import type { VenueRoute } from '@/lib/venueSlugs';

export const FESTIE_NPC_ID_PREFIX = 'festie-';

export function festieNpcId(festieId: string): string {
  return `${FESTIE_NPC_ID_PREFIX}${festieId}`;
}

export function isFestieNpcId(id: string): boolean {
  return id.startsWith(FESTIE_NPC_ID_PREFIX);
}

export function festieIdFromNpcId(npcId: string): string | null {
  if (!isFestieNpcId(npcId)) return null;
  return npcId.slice(FESTIE_NPC_ID_PREFIX.length) || null;
}

function attributesToPersonality(attrs: FestieAttributes): Personality {
  const energy = attrs.energy / 10;
  const chatty = attrs.chattiness / 10;
  return {
    speed: 0.04 + energy * 0.1,
    idleMs: [
      Math.round(3200 - chatty * 2200),
      Math.round(7200 - chatty * 4200),
    ],
    wanderRange: [-20, 118],
    jumpiness: 0.05 + energy * 0.5,
  };
}

function festiePersonalityNotes(festie: FestiePublic): string {
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

/** Map a synced offline festie into the same shape as ambient NPCs. */
export function festieToCharacterDef(
  festie: FestiePublic,
  route: VenueRoute,
  index: number,
): CharacterDef {
  const preset = festiePresetById(festie.preset);
  const anchor = stageAnchorForRoute(route);
  const fromLeft = index % 2 === 0;

  return {
    id: festieNpcId(festie.id),
    name: festie.name,
    balloonColor: preset.balloonColor,
    outfit: preset.outfit,
    startX: fromLeft ? -16 - (index % 3) * 5 : 108 + (index % 3) * 5,
    entryDirection: fromLeft ? 'right' : 'left',
    entryDelay: 2_000 + index * 1_500,
    stageCrowd: anchor ?? undefined,
    personality: attributesToPersonality(festie.attributes),
    personalityNotes: festiePersonalityNotes(festie),
    modelId: festieModelIdForProvider(festie.llm_provider),
  };
}

export function festiesToCharacterDefs(
  festies: FestiePublic[],
  route: VenueRoute,
): CharacterDef[] {
  return festies.map((festie, index) => festieToCharacterDef(festie, route, index));
}
