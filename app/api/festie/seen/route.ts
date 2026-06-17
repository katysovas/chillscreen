import { NextResponse } from 'next/server';
import { userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { getFestieByUserId, setFestieOwnerOnline, touchFestieSeen } from '@/lib/festie/db';
import { FESTIE_EVENT_TYPES, logFestieEvent } from '@/lib/festie/events';
import { verifyChatterRequest } from '@/lib/npcChatter/auth';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** POST — PartyKit: owner left. Session cookie: refresh last_seen while still in-game. */
export async function POST(request: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  let userId: string | null = null;
  let partyKitLeave = false;

  const chatterDenied = verifyChatterRequest(request);
  if (!chatterDenied) {
    partyKitLeave = true;
    try {
      const body = await request.json() as { userId?: string };
      const raw = body.userId?.trim();
      if (raw && UUID_RE.test(raw)) userId = raw;
    } catch {
      /* empty body */
    }
  }

  if (!userId) {
    userId = userIdFromRequest(request);
  }

  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  try {
    if (partyKitLeave) {
      const festie = await getFestieByUserId(userId);
      if (festie) {
        logFestieEvent(festie.id, FESTIE_EVENT_TYPES.OWNER_LEAVE, {
          stage_slug: festie.stage_slug,
        });
      }
      await touchFestieSeen(userId);
      await setFestieOwnerOnline(userId, false);
    } else {
      await touchFestieSeen(userId);
      await setFestieOwnerOnline(userId, true);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/festie/seen POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
