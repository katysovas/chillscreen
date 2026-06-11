/**
 * Bundled copy of data/seeds.json — fallback when DB/API unavailable (PartyKit local dev).
 * Keeps NPC pair-chatter seed distribution identical to the pre-DB behavior.
 */

import seedsData from '@/data/seeds.json';
import type { SeedPools } from '@/lib/seeds/db';

type SeedPool = {
  generated?: string[];
  fallback?: string[];
};

type BundledSeedsFile = {
  generated?: string[];
  fallback?: string[];
  stages?: Record<string, SeedPool>;
};

const seeds = seedsData as BundledSeedsFile;

/** Same merge as the old mergedSeedPool() over seeds.json. */
export function getBundledSeedPools(stageSlug: string | null | undefined): SeedPools {
  const globalGenerated = seeds.generated ?? [];
  const globalFallback = seeds.fallback ?? [];
  if (!stageSlug?.trim()) {
    return {
      generated: [...globalGenerated],
      fallback: [...globalFallback],
    };
  }
  const stage = seeds.stages?.[stageSlug.trim()] ?? {};
  return {
    generated: [...globalGenerated, ...(stage.generated ?? [])],
    fallback: [...globalFallback, ...(stage.fallback ?? [])],
  };
}

export function bundledPoolHasLines(pools: SeedPools): boolean {
  return pools.generated.length + pools.fallback.length > 0;
}
