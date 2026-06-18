import { unstable_cache } from 'next/cache';
import { getDb } from '@/lib/db';
import { countActiveUserStages } from '@/lib/stages/db';

const CACHE_SECONDS = 60;

/** Active creator stages for landing hero + /api/stages/stats — cached 60s. */
export const getLandingCreatorStageCount = unstable_cache(
  async (): Promise<number> => {
    if (!getDb()) return 0;
    return countActiveUserStages();
  },
  ['landing-creator-stage-count-v1'],
  { revalidate: CACHE_SECONDS },
);
