import { NextResponse } from 'next/server';
import { unstable_cache } from 'next/cache';
import { resolveRealFestieCounts } from '@/lib/festie/stagePresenceCounts';

/** Server data cache TTL — DB + PartyKit fan-out is expensive. */
export const revalidate = 60;

const CACHE_SECONDS = 60;
const CDN_SMAXAGE = 30;

const getFestieCounts = unstable_cache(
  async () => resolveRealFestieCounts(),
  ['festie-counts-v1'],
  { revalidate: CACHE_SECONDS },
);

/** GET — real festie counts per stage (`festies`); client adds ambient NPCs. */
export async function GET() {
  try {
    const festies = await getFestieCounts();
    return NextResponse.json(
      { festies },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CDN_SMAXAGE}, stale-while-revalidate=${CACHE_SECONDS}`,
        },
      },
    );
  } catch (err) {
    console.error('[api/festies/counts GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
