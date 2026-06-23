import type { StageChannel } from '@/lib/stageVideos';
import { npcPoolKey } from '@/lib/easel/drawingsPool';

/** Stage scenery nouns — open-ended fixation pool per channel. */
const STAGE_FIXATION: Record<StageChannel, string[]> = {
  forest: [
    'pinecone', 'mushroom', 'owl', 'fern', 'campfire', 'totem', 'acorn', 'moss',
    'lantern', 'canteen', 'treefrog', 'compass',
  ],
  'silent-disco': [
    'headphones', 'glowstick', 'disco ball', 'speaker', 'neon sign', 'dance floor',
    'sunglasses', 'boombox',
  ],
  coachella: [
    'ferris wheel', 'palm tree', 'cactus', 'sun hat', 'windmill', 'balloon', 'taco',
    'flower crown',
  ],
  edc: [
    'sphere', 'slot machine', 'neon heart', 'dice', 'cherry', 'poker chip', 'rocket',
    'martini',
  ],
  bumbershoot: [
    'umbrella', 'rain boot', 'coffee cup', 'vinyl record', 'kite', 'ferry', 'mountain',
    'rainbow',
  ],
  'outside-lands': [
    'bridge', 'fog', 'oak tree', 'burrito', 'wine glass', 'tram', 'seagull', 'twin peaks',
  ],
  cinema: [
    'popcorn', 'film reel', 'ticket', 'clapperboard', 'soda cup', 'star', 'camera',
    'director chair',
  ],
  'deep-space': [
    'rocket', 'planet', 'alien', 'satellite', 'comet', 'astronaut', 'ufo', 'moon',
  ],
  'which-stage': [
    'guitar', 'microphone', 'drum', 'amplifier', 'pick', 'setlist', 'cable', 'pedal',
  ],
  hula: [
    'pumpkin', 'candy corn', 'bat', 'cauldron', 'ghost', 'spider', 'lantern', 'witch hat',
  ],
  headliner: [
    'sun', 'star', 'guitar', 'microphone', 'cloud', 'moon', 'speaker', 'flower crown',
  ],
};

/** Per-NPC preferred subject when available in the stage pool. */
const NPC_SUBJECT_AFFINITY: Record<string, Partial<Record<StageChannel, string>>> = {
  jenna: { forest: 'pinecone' },
  ace: { edc: 'slot machine' },
  briar: { edc: 'poker chip' },
  cruz: { edc: 'cherry' },
  daphne: { edc: 'neon heart' },
  ellis: { edc: 'dice' },
  flora: { edc: 'rocket' },
};

/** Recognizable at small grid sizes — preferred for batch generation. */
const EASY_SUBJECTS: Partial<Record<StageChannel, ReadonlySet<string>>> = {
  edc: new Set(['cherry', 'dice', 'poker chip', 'rocket', 'neon heart', 'slot machine']),
  forest: new Set(['pinecone', 'mushroom', 'acorn', 'owl', 'campfire', 'lantern']),
  cinema: new Set(['popcorn', 'star', 'ticket', 'soda cup', 'film reel']),
  coachella: new Set(['cactus', 'palm tree', 'taco', 'balloon', 'sun hat']),
};

/** Abstract or hard-to-read at low resolution — deprioritized. */
const HARD_SUBJECTS: Partial<Record<StageChannel, ReadonlySet<string>>> = {
  edc: new Set(['sphere', 'martini']),
  'outside-lands': new Set(['fog', 'twin peaks']),
  'silent-disco': new Set(['dance floor']),
};

const DEFAULT_FIXATION = [
  'star', 'heart', 'cloud', 'tree', 'flower', 'cat', 'dog', 'house', 'sun', 'moon',
];

function hashSeed(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function normalizeSubject(s: string): string {
  return s.toLowerCase().trim();
}

function buildCandidateList(
  channel: StageChannel,
  exclude: string[],
): string[] {
  const pool = STAGE_FIXATION[channel] ?? DEFAULT_FIXATION;
  const blocked = new Set(exclude.map(normalizeSubject));
  const available = pool.filter(s => !blocked.has(normalizeSubject(s)));
  if (available.length === 0) return [...pool];

  const easy = EASY_SUBJECTS[channel];
  const hard = HARD_SUBJECTS[channel];
  const easyAvail = easy
    ? available.filter(s => easy.has(normalizeSubject(s)))
    : [];
  if (easyAvail.length > 0) return easyAvail;

  const notHard = hard
    ? available.filter(s => !hard.has(normalizeSubject(s)))
    : available;
  return notHard.length > 0 ? notHard : available;
}

/** Pick a drawable subject from the NPC's stage fixation set. */
export function pickFixationSubject(
  channel: StageChannel,
  npcId: string,
  exclude: string[] = [],
): string {
  const key = npcPoolKey(npcId);
  const blocked = new Set(exclude.map(normalizeSubject));

  const affinity = NPC_SUBJECT_AFFINITY[key]?.[channel];
  if (affinity && !blocked.has(normalizeSubject(affinity))) {
    return affinity;
  }

  const list = buildCandidateList(channel, exclude);
  const idx = hashSeed(`${channel}:${key}:${Date.now()}`) % list.length;
  return list[idx]!;
}

export { STAGE_FIXATION };
