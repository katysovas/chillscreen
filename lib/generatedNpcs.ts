/**
 * Generated ambient NPCs — loaded from `data/generated-npcs.json` (written by
 * the localhost admin at /admin/npc-generator) and converted into the same
 * CharacterDef shape as the hardcoded cast.
 */

import generatedNpcsFile from '@/data/generated-npcs.json';
import type { CharacterDef } from '@/components/game/characters';
import type { CharacterLoadout } from '@/components/game/characters/loadout';
import type { Personality } from '@/components/game/NPC';
import type { StageAnchorKind } from '@/lib/stageAnchor';
import type { StageChannel } from '@/lib/stageVideos';
import { dedupeGeneratedNpcs, type GeneratedNpc } from '@/lib/npcGenerator';

/** Map playlist channel → live stage anchor for crowd placement. */
const CHANNEL_STAGE_ANCHOR: Partial<Record<StageChannel, StageAnchorKind>> = {
  'outside-lands': 'concert',
  bumbershoot: 'concert',
  coachella: 'coachella',
  edc: 'edc',
  'which-stage': 'which-stage',
  forest: 'forest',
  'silent-disco': 'silent-disco',
};

/** Share of sampled NPCs already in front of the stage when the city loads. */
const STAGE_CROWD_AT_LOAD_RATIO = 0.7;

/** Ambient crowd size per visit — fraction of the saved pool. */
const AMBIENT_SAMPLE_MIN_RATIO = 0.45;
const AMBIENT_SAMPLE_MIN_FLOOR = 6;
/** Stage-crowd share jitters per visit so loads do not feel identical. */
const STAGE_CROWD_RATIO_JITTER = 0.15;

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
  if (prop.startsWith('mask-')) return { mask: prop };
  // hand-*, food-*, drink-*, party-* all mount in the hand slot.
  return { hand: prop };
}

function slugName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}

/** Generated crowd wanders across the full downstage floor. */
const GENERATED_WANDER: [number, number] = [8, 92];

function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (Math.imul(t ^ (t >>> 7), 61 | t) ^ t) >>> 0;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick a random subset of the channel pool — stable for one seed (one stage visit). */
export function sampleGeneratedNpcs(
  pool: GeneratedNpc[],
  seed: number,
): { npcs: GeneratedNpc[]; stageCrowdRatio: number } {
  const deduped = dedupeGeneratedNpcs(pool);
  if (deduped.length === 0) {
    return { npcs: [], stageCrowdRatio: STAGE_CROWD_AT_LOAD_RATIO };
  }

  const rand = mulberry32(seed);
  const minCount = Math.min(
    deduped.length,
    Math.max(AMBIENT_SAMPLE_MIN_FLOOR, Math.ceil(deduped.length * AMBIENT_SAMPLE_MIN_RATIO)),
  );
  const count = minCount + Math.floor(rand() * (deduped.length - minCount + 1));

  const order = deduped.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }

  const npcs = order
    .slice(0, count)
    .map(i => deduped[i])
    .filter((n): n is GeneratedNpc => n != null && Boolean(n.archetype));

  const stageCrowdRatio = Math.min(
    0.9,
    Math.max(0.5, STAGE_CROWD_AT_LOAD_RATIO + (rand() - 0.5) * STAGE_CROWD_RATIO_JITTER * 2),
  );

  return { npcs, stageCrowdRatio };
}

function toCharacterDef(
  npc: GeneratedNpc,
  channel: StageChannel,
  index: number,
  stageCrowdCount: number,
): CharacterDef {
  const fromLeft = index % 2 === 0;
  const base = ARCHETYPE_PERSONALITY[npc.archetype] ?? ARCHETYPE_PERSONALITY.chiller;
  const anchor = CHANNEL_STAGE_ANCHOR[channel];
  const onStageAtLoad = index < stageCrowdCount;
  const trickleIndex = Math.max(0, index - stageCrowdCount);

  return {
    id: `gen-${channel}-${slugName(npc.name)}`,
    name: npc.name,
    balloonColor: BALLOON_PALETTE[index % BALLOON_PALETTE.length]!,
    loadout: loadoutForProp(npc.prop),
    outfit: npc.outfit && npc.outfit !== 'none' ? npc.outfit : undefined,
    startX: onStageAtLoad
      ? 10 + (index % 17) * 5
      : fromLeft ? -20 - (index % 3) * 4 : 112 + (index % 3) * 4,
    entryDirection: fromLeft ? 'right' : 'left',
    entryDelay: onStageAtLoad
      ? index * 250
      : 6_000 + trickleIndex * 4_000,
    stageCrowd: onStageAtLoad && anchor ? anchor : undefined,
    personality: { ...base, wanderRange: GENERATED_WANDER },
    personalityNotes: npc.personalityNotes || npc.vibe,
    modelId: npc.modelId,
  };
}

/** Full generated pool for one channel (chat lookup, admin). */
export function generatedCharactersForChannel(channel: StageChannel): CharacterDef[] {
  const npcs = dedupeGeneratedNpcs(FILE.channels[channel] ?? []);
  const stageCrowdCount = Math.ceil(npcs.length * STAGE_CROWD_AT_LOAD_RATIO);
  return npcs.map((npc, i) => toCharacterDef(npc, channel, i, stageCrowdCount));
}

/** Random ambient subset for one stage visit — does not affect festie/player NPCs. */
export function sampledGeneratedCharactersForChannel(
  channel: StageChannel,
  seed: number,
): CharacterDef[] {
  const pool = FILE.channels[channel] ?? [];
  const { npcs, stageCrowdRatio } = sampleGeneratedNpcs(pool, seed);
  const stageCrowdCount = Math.ceil(npcs.length * stageCrowdRatio);
  return npcs.map((npc, i) => toCharacterDef(npc, channel, i, stageCrowdCount));
}

/** All generated NPCs across every stage (chat API lookup). */
export function allGeneratedCharacters(): CharacterDef[] {
  return (Object.keys(FILE.channels) as StageChannel[]).flatMap(ch => {
    const npcs = dedupeGeneratedNpcs(FILE.channels[ch] ?? []);
    const stageCrowdCount = Math.ceil(npcs.length * STAGE_CROWD_AT_LOAD_RATIO);
    return npcs.map((npc, i) => toCharacterDef(npc, ch, i, stageCrowdCount));
  });
}
