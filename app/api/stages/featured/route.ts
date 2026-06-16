import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { getDb } from '@/lib/db';
import { listFeaturedUserStages } from '@/lib/stages/db';

export const revalidate = 60;

const CACHE_SECONDS = 60;

const getFeaturedStages = unstable_cache(
  async () => {
    if (!getDb()) return [];
    return listFeaturedUserStages();
  },
  ['stage-featured-v1'],
  { revalidate: CACHE_SECONDS },
);

/** GET — featured creator stages for the Switch Stages picker. */
export async function GET() {
  try {
    const stages = await getFeaturedStages();
    return NextResponse.json(
      { stages },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
        },
      },
    );
  } catch (err) {
    console.error('[api/stages/featured GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
