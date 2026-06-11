import {
  SEED_AMBIENT_PCT,
  SEED_GENERATED_PCT,
  SEED_STREAM_REACTIVE_PCT,
} from '@/lib/npcChatter/constants';
import type { FestiePublic } from '@/lib/festie/types';
import type { SeedPools } from '@/lib/seeds/db';

export type SeedPick =
  | { kind: 'stream'; seed: string }
  | { kind: 'topic'; seed: string }
  | { kind: 'ambient'; seed: null };

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)]!;
}

/** Pick a room-chatter seed from pre-loaded pools (DB-backed). */
export function pickConversationSeedFromPools(
  streamTitle: string | null,
  channelName: string,
  pools: SeedPools,
): SeedPick {
  const roll = Math.random();
  if (roll < SEED_STREAM_REACTIVE_PCT && streamTitle?.trim()) {
    return {
      kind: 'stream',
      seed: `react to what's playing right now: ${streamTitle.trim()} — ${channelName}`,
    };
  }
  if (roll < SEED_STREAM_REACTIVE_PCT + SEED_GENERATED_PCT) {
    const topic = pickRandom(pools.generated) ?? pickRandom(pools.fallback);
    if (topic) return { kind: 'topic', seed: topic };
  }
  if (roll < SEED_STREAM_REACTIVE_PCT + SEED_GENERATED_PCT + SEED_AMBIENT_PCT) {
    return { kind: 'ambient', seed: null };
  }
  const fallback = pickRandom(pools.fallback);
  return fallback ? { kind: 'topic', seed: fallback } : { kind: 'ambient', seed: null };
}

/** Bias seed lines toward festie topic tags from settings. */
export function pickSeedForFestie(
  festie: FestiePublic,
  pools: SeedPools,
): string | null {
  const topics = festie.topics.map(t => t.toLowerCase()).filter(Boolean);
  const all = [...pools.generated, ...pools.fallback];
  if (all.length === 0) return null;

  if (topics.length > 0) {
    const matched = all.filter(line => {
      const lower = line.toLowerCase();
      return topics.some(topic => lower.includes(topic));
    });
    if (matched.length > 0) return pickRandom(matched);
  }

  return pickRandom(pools.generated) ?? pickRandom(pools.fallback);
}
