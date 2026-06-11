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

function pickRandom<T>(arr: T[]): T | null {
  if (arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)]!;
}

export function pickConversationSeed(
  streamTitle: string | null,
  channelName: string,
): SeedPick {
  const roll = Math.random();
  if (roll < SEED_STREAM_REACTIVE_PCT && streamTitle?.trim()) {
    return {
      kind: 'stream',
      seed: `react to what's playing right now: ${streamTitle.trim()} — ${channelName}`,
    };
  }
  if (roll < SEED_STREAM_REACTIVE_PCT + SEED_GENERATED_PCT) {
    const generated = seedsData.generated ?? [];
    const topic = pickRandom(generated) ?? pickRandom(seedsData.fallback ?? []);
    if (topic) return { kind: 'topic', seed: topic };
  }
  if (roll < SEED_STREAM_REACTIVE_PCT + SEED_GENERATED_PCT + SEED_AMBIENT_PCT) {
    return { kind: 'ambient', seed: null };
  }
  const fallback = pickRandom(seedsData.fallback ?? []);
  return fallback ? { kind: 'topic', seed: fallback } : { kind: 'ambient', seed: null };
}
