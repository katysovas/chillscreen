/**
 * Client-side generated NPC pool — one channel per dynamic import chunk.
 */

import type { CharacterDef } from '@/components/game/characters';
import type { StageChannel } from '@/lib/stageVideos';
import { dedupeGeneratedNpcs, type GeneratedNpc } from '@/lib/npcGenerator';
import {
  characterDefsFromFullPool,
  characterDefsFromPool,
} from './generatedNpcsCore';

const channelCache = new Map<StageChannel, GeneratedNpc[]>();
const channelLoads = new Map<StageChannel, Promise<GeneratedNpc[]>>();

const CHANNEL_IMPORTS: Record<
  StageChannel,
  () => Promise<{ default: GeneratedNpc[] }>
> = {
  cinema: () => import('@/data/generated-npcs/channels/cinema.json').then(m => ({ default: m.default as GeneratedNpc[] })),
  'deep-space': () => import('@/data/generated-npcs/channels/deep-space.json').then(m => ({ default: m.default as GeneratedNpc[] })),
  bumbershoot: () => import('@/data/generated-npcs/channels/bumbershoot.json').then(m => ({ default: m.default as GeneratedNpc[] })),
  'outside-lands': () => import('@/data/generated-npcs/channels/outside-lands.json').then(m => ({ default: m.default as GeneratedNpc[] })),
  coachella: () => import('@/data/generated-npcs/channels/coachella.json').then(m => ({ default: m.default as GeneratedNpc[] })),
  edc: () => import('@/data/generated-npcs/channels/edc.json').then(m => ({ default: m.default as GeneratedNpc[] })),
  'which-stage': () => import('@/data/generated-npcs/channels/which-stage.json').then(m => ({ default: m.default as GeneratedNpc[] })),
  forest: () => import('@/data/generated-npcs/channels/forest.json').then(m => ({ default: m.default as GeneratedNpc[] })),
  'silent-disco': () => import('@/data/generated-npcs/channels/silent-disco.json').then(m => ({ default: m.default as GeneratedNpc[] })),
  hula: () => import('@/data/generated-npcs/channels/hula.json').then(m => ({ default: m.default as GeneratedNpc[] })),
  headliner: () => import('@/data/generated-npcs/channels/headliner.json').then(m => ({ default: m.default as GeneratedNpc[] })),
};

export function preloadGeneratedNpcsForChannel(channel: StageChannel): Promise<void> {
  return loadGeneratedNpcsForChannel(channel).then(() => {});
}

export function loadGeneratedNpcsForChannel(channel: StageChannel): Promise<GeneratedNpc[]> {
  const hit = channelCache.get(channel);
  if (hit) return Promise.resolve(hit);

  let pending = channelLoads.get(channel);
  if (!pending) {
    pending = CHANNEL_IMPORTS[channel]()
      .then(mod => {
        const list = dedupeGeneratedNpcs(mod.default ?? []);
        channelCache.set(channel, list);
        return list;
      })
      .finally(() => {
        channelLoads.delete(channel);
      });
    channelLoads.set(channel, pending);
  }
  return pending;
}

export function sampledGeneratedCharactersForChannel(
  channel: StageChannel,
  seed: number,
): CharacterDef[] {
  const pool = channelCache.get(channel) ?? [];
  return characterDefsFromPool(pool, channel, seed);
}

export function generatedCharactersForChannel(channel: StageChannel): CharacterDef[] {
  const pool = channelCache.get(channel) ?? [];
  return characterDefsFromFullPool(pool, channel);
}
