import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { reclaimStaleStageSlugs } from '@/lib/stages/db';

export const dynamic = 'force-dynamic';

function verifyCronRequest(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return process.env.NODE_ENV === 'development';

  const auth = request.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

/** GET — daily reclaim of dormant stage slugs (90d+ inactive). */
export async function GET(request: Request) {
  if (!verifyCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  try {
    const reclaimed = await reclaimStaleStageSlugs();
    return NextResponse.json({ ok: true, reclaimed });
  } catch (err) {
    console.error('[cron/reclaim-stage-slugs]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
