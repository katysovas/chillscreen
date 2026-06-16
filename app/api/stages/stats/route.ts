import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { countActiveUserStages } from '@/lib/stages/db';

export const dynamic = 'force-dynamic';

/** GET — active creator stage count for landing page stats. */
export async function GET() {
  if (!getDb()) {
    return NextResponse.json({ creatorStages: 0 });
  }

  try {
    const creatorStages = await countActiveUserStages();
    return NextResponse.json({ creatorStages });
  } catch (err) {
    console.error('[api/stages/stats GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
