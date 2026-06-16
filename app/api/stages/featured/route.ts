import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { listFeaturedUserStages } from '@/lib/stages/db';

export const dynamic = 'force-dynamic';

/** GET — featured creator stages for the Switch Stages picker. */
export async function GET() {
  if (!getDb()) {
    return NextResponse.json({ stages: [] });
  }

  try {
    const stages = await listFeaturedUserStages();
    return NextResponse.json({ stages });
  } catch (err) {
    console.error('[api/stages/featured GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
