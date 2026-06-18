import { NextResponse } from 'next/server';
import { getLandingCreatorStageCount } from '@/lib/landing/stageStats';

export const revalidate = 60;

const CACHE_SECONDS = 60;

/** GET — active creator stage count for landing page stats. */
export async function GET() {
  try {
    const creatorStages = await getLandingCreatorStageCount();
    return NextResponse.json(
      { creatorStages },
      {
        headers: {
          'Cache-Control': `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=${CACHE_SECONDS}`,
        },
      },
    );
  } catch (err) {
    console.error('[api/stages/stats GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
