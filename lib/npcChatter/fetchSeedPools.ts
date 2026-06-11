import { chatterAuthHeader } from '@/lib/npcChatter/auth';
import { bundledPoolHasLines, getBundledSeedPools } from '@/lib/seeds/bundled';
import type { SeedPools } from '@/lib/seeds/db';

export async function fetchSeedPoolsRemote(
  stageSlug: string | null | undefined,
  apiBase: string,
  secret?: string,
): Promise<SeedPools> {
  const bundled = getBundledSeedPools(stageSlug);

  try {
    const params = new URLSearchParams();
    if (stageSlug?.trim()) params.set('stage_slug', stageSlug.trim());

    const res = await fetch(`${apiBase.replace(/\/+$/, '')}/api/seeds/pool?${params}`, {
      headers: chatterAuthHeader(secret),
    });
    if (!res.ok) {
      console.error('[seeds/pool] api', res.status, await res.text(), '— using bundled seeds');
      return bundled;
    }
    const data = await res.json() as Partial<SeedPools>;
    const pools: SeedPools = {
      generated: Array.isArray(data.generated) ? data.generated : [],
      fallback: Array.isArray(data.fallback) ? data.fallback : [],
    };
    if (bundledPoolHasLines(pools)) return pools;
    console.warn('[seeds/pool] empty DB response — using bundled seeds');
    return bundled;
  } catch (err) {
    console.error('[seeds/pool] fetch failed', err, '— using bundled seeds');
    return bundled;
  }
}
