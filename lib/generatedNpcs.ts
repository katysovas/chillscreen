/**
 * Generated ambient NPCs — loaded from `data/generated-npcs.json` (written by
 * the localhost admin at /admin/npc-generator) and converted into the same
 * CharacterDef shape as the hardcoded cast.
 */

import generatedNpcsFile from '@/data/generated-npcs.json';
import type { CharacterDef } from '@/components/game/characters';
import type { CharacterLoadout } from '@/components/game/characters/loadout';
import type { Personality } from '@/components/game/NPC';
import type { StageChannel } from '@/lib/stageVideos';
import { dedupeGeneratedNpcs, type GeneratedNpc } from '@/lib/npcGenerator';

const FILE = generatedNpcsFile as {
  version: number;
  channels: Partial<Record<StageChannel, GeneratedNpc[]>>;
};

/** Movement presets per archetype — tuned against the hardcoded cast. */
const ARCHETYPE_PERSONALITY: Record<GeneratedNpc['archetype'], Personality> = {
  chiller: { speed: 0.04, idleMs: [3000, 7000], wanderRange: [-10, 60], jumpiness: 0.05 },
  dancer: { speed: 0.12, idleMs: [600, 1600], wanderRange: [20, 90], jumpiness: 0.5 },
  wanderer: { speed: 0.09, idleMs: [1500, 4000], wanderRange: [-25, 120], jumpiness: 0.3 },
  vendor: { speed: 0.03, idleMs: [4000, 9000], wanderRange: [15, 45], jumpiness: 0.05 },
  hustler: { speed: 0.14, idleMs: [500, 1400], wanderRange: [0, 110], jumpiness: 0.55 },
};

const BALLOON_PALETTE = [
  '#4a8fe8', '#6abf69', '#e04f8e', '#f0a828', '#9d5cff',
  '#36b3a8', '#d4893a', '#e85074', '#3d9bff', '#b8a02e',
];

/** Map a store prop id to the loadout slot it occupies. */
function loadoutForProp(prop: string | null): CharacterLoadout | undefined {
  if (!prop) return undefined;
  if (prop.startsWith('hat-')) return { hat: prop };
  if (prop.startsWith('shades-')) return { sunglasses: prop };
  // hand-*, food-*, drink-*, party-* all mount in the hand slot.
  return { hand: prop };
}

function slugName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/** Keep generated crowd near the stage — not wandering off-screen. */
const GENERATED_WANDER: [number, number] = [20, 80];

function toCharacterDef(npc: GeneratedNpc, channel: StageChannel, index: number): CharacterDef {
  const fromLeft = index % 2 === 0;
  const base = ARCHETYPE_PERSONALITY[npc.archetype];
  return {
    id: `gen-${channel}-${index}-${slugName(npc.name)}`,
    name: npc.name,
    balloonColor: BALLOON_PALETTE[index % BALLOON_PALETTE.length]!,
    loadout: loadoutForProp(npc.prop),
    outfit: npc.outfit && npc.outfit !== 'none' ? npc.outfit : undefined,
    startX: fromLeft ? -20 - (index % 3) * 4 : 112 + (index % 3) * 4,
    entryDirection: fromLeft ? 'right' : 'left',
    entryDelay: 1_500 + index * 2_000,
    personality: { ...base, wanderRange: GENERATED_WANDER },
    personalityNotes: npc.personalityNotes || npc.vibe,
    ambientLines: npc.lines,
  };
}

/** Generated NPCs for one stage channel, converted to CharacterDefs. */
export function generatedCharactersForChannel(channel: StageChannel): CharacterDef[] {
  return dedupeGeneratedNpcs(FILE.channels[channel] ?? []).map((npc, i) =>
    toCharacterDef(npc, channel, i),
  );
}

/** All generated NPCs across every stage (chat API lookup). */
export function allGeneratedCharacters(): CharacterDef[] {
  return (Object.keys(FILE.channels) as StageChannel[]).flatMap(ch =>
    generatedCharactersForChannel(ch),
  );
}
