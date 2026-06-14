import { NextResponse } from 'next/server';
import { userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { setFestieOwnerOnline } from '@/lib/festie/db';
import { verifyChatterRequest } from '@/lib/npcChatter/auth';

export const dynamic = 'force-dynamic';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** POST — mark festie owner online/offline (PartyKit join / debounced disconnect). */
export async function POST(request: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  let userId: string | null = null;
  let online = true;

  const chatterDenied = verifyChatterRequest(request);
  if (!chatterDenied) {
    try {
      const body = await request.json() as { userId?: string; online?: boolean };
      const raw = body.userId?.trim();
      if (raw && UUID_RE.test(raw)) userId = raw;
      if (typeof body.online === 'boolean') online = body.online;
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
    await setFestieOwnerOnline(userId, online);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[api/festie/presence POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
