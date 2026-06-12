import { NextResponse } from 'next/server';
import { userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { getFestieByUserId } from '@/lib/festie/db';
import {
  countFestieChatsInEvents,
  listFestieEventsSince,
  sumFestieCoinsSince,
} from '@/lib/festie/events';

export const dynamic = 'force-dynamic';

/** GET — festie activity log since a timestamp (default: festie last_seen_at). */
export async function GET(request: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const userId = userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  const festie = await getFestieByUserId(userId);
  if (!festie) {
    return NextResponse.json({ error: 'No festie' }, { status: 404 });
  }

  const url = new URL(request.url);
  const sinceParam = url.searchParams.get('since')?.trim();
  const since = sinceParam && !Number.isNaN(Date.parse(sinceParam))
    ? new Date(sinceParam).toISOString()
    : festie.last_seen_at;

  try {
    const events = await listFestieEventsSince(festie.id, since);
    const coinsEarned = await sumFestieCoinsSince(festie.id, since);
    return NextResponse.json({
      since,
      events,
      coinsEarned,
      chatCount: countFestieChatsInEvents(events),
    });
  } catch (err) {
    console.error('[api/festie/events GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
