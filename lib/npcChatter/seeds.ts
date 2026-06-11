import seedsData from '@/data/seeds.json';
import {
  SEED_AMBIENT_PCT,
  SEED_GENERATED_PCT,
  SEED_STREAM_REACTIVE_PCT,
} from './constants';

export type SeedPick =
  | { kind: 'stream'; seed: string }
  | { kind: 'topic'; seed: string }
  | { kind: 'ambient'; seed: null };

type SeedPool = {
  generated?: string[];
  fallback?: string[];
};

type SeedsFile = {
  generated?: string[];
  fallback?: string[];
  stages?: Record<string, SeedPool>;
};

const seeds = seedsData as SeedsFile;

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Global pool + optional stage-specific additions (venue slug, e.g. `thefarm`). */
export function mergedSeedPool(
  stageSlug: string | null | undefined,
  kind: 'generated' | 'fallback',
): string[] {
  const global = seeds[kind] ?? [];
  if (!stageSlug) return global;
  const stage = seeds.stages?.[stageSlug]?.[kind] ?? [];
  return [...global, ...stage];
}

export function pickConversationSeed(
  streamTitle: string | null,
  channelName: string,
  stageSlug?: string | null,
): SeedPick {
  const roll = Math.random();
  if (roll < SEED_STREAM_REACTIVE_PCT && streamTitle?.trim()) {
    return {
      kind: 'stream',
      seed: `react to what's playing right now: ${streamTitle.trim()} — ${channelName}`,
    };
  }
  if (roll < SEED_STREAM_REACTIVE_PCT + SEED_GENERATED_PCT) {
    const generated = mergedSeedPool(stageSlug, 'generated');
    const topic = pickRandom(generated) ?? pickRandom(mergedSeedPool(stageSlug, 'fallback'));
    if (topic) return { kind: 'topic', seed: topic };
  }
  if (roll < SEED_STREAM_REACTIVE_PCT + SEED_GENERATED_PCT + SEED_AMBIENT_PCT) {
    return { kind: 'ambient', seed: null };
  }
  const fallback = pickRandom(mergedSeedPool(stageSlug, 'fallback'));
  return fallback ? { kind: 'topic', seed: fallback } : { kind: 'ambient', seed: null };
}
