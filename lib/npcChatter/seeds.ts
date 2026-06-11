import { fetchSeedPoolsRemote } from '@/lib/npcChatter/fetchSeedPools';
import { getBundledSeedPools } from '@/lib/seeds/bundled';
import type { SeedPools } from '@/lib/seeds/db';
import { pickConversationSeedFromPools, type SeedPick } from '@/lib/seeds/pick';

export type { SeedPick };

const POOL_CACHE_MS = 5 * 60_000;
const poolCache = new Map<string, { pools: SeedPools; at: number }>();

function cacheKey(stageSlug: string | null | undefined): string {
  return stageSlug?.trim() || '__global__';
}

/** Global + stage pool merge — bundled JSON (same as pre-DB in-memory path). */
export function mergedSeedPool(
  stageSlug: string | null | undefined,
  kind: 'generated' | 'fallback',
): string[] {
  const pools = getBundledSeedPools(stageSlug);
  return kind === 'generated' ? pools.generated : pools.fallback;
}

function isSeedPools(value: unknown): value is SeedPools {
  return typeof value === 'object' && value !== null
    && Array.isArray((value as SeedPools).generated)
    && Array.isArray((value as SeedPools).fallback);
}

/** Pick a seed — pass stage slug (bundled) or pre-loaded pools. */
export function pickConversationSeed(
  streamTitle: string | null,
  channelName: string,
  stageSlugOrPools: string | null | undefined | SeedPools,
): SeedPick {
  const pools = isSeedPools(stageSlugOrPools)
    ? stageSlugOrPools
    : getBundledSeedPools(stageSlugOrPools);
  return pickConversationSeedFromPools(streamTitle, channelName, pools);
}

async function loadSeedPools(
  stageSlug: string | null | undefined,
  apiBase: string,
  secret?: string,
): Promise<SeedPools> {
  const key = cacheKey(stageSlug);
  const hit = poolCache.get(key);
  if (hit && Date.now() - hit.at < POOL_CACHE_MS) return hit.pools;

  const pools = await fetchSeedPoolsRemote(stageSlug, apiBase, secret);
  poolCache.set(key, { pools, at: Date.now() });
  return pools;
}

/** Fetch pools (cached) then pick — PartyKit pair chatter. */
export async function pickConversationSeedRemote(
  streamTitle: string | null,
  channelName: string,
  stageSlug: string | null | undefined,
  apiBase: string,
  secret?: string,
): Promise<SeedPick> {
  const pools = await loadSeedPools(stageSlug, apiBase, secret);
  return pickConversationSeedFromPools(streamTitle, channelName, pools);
}
