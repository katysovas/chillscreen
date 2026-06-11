import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyChatterRequest } from '@/lib/npcChatter/auth';
import { getMergedSeedPools } from '@/lib/seeds/db';

export const dynamic = 'force-dynamic';

/** GET — merged seed pools for a stage (PartyKit + festie chat). */
export async function GET(req: Request) {
  const denied = verifyChatterRequest(req);
  if (denied) return denied;

  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const url = new URL(req.url);
  const stageSlug = url.searchParams.get('stage_slug')?.trim() || null;

  try {
    const pools = await getMergedSeedPools(stageSlug);
    return NextResponse.json(pools);
  } catch (err) {
    console.error('[api/seeds/pool GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
