import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getDb } from '@/lib/db';
import { countActiveUserStages } from '@/lib/stages/db';

export const revalidate = 60;

const CACHE_SECONDS = 60;

const getStageStats = unstable_cache(
  async () => {
    if (!getDb()) return { creatorStages: 0 };
    const creatorStages = await countActiveUserStages();
    return { creatorStages };
  },
  ['stage-stats-v1'],
  { revalidate: CACHE_SECONDS },
);

/** GET — active creator stage count for landing page stats. */
export async function GET() {
  try {
    const data = await getStageStats();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
      },
    });
  } catch (err) {
    console.error('[api/stages/stats GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
