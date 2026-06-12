import { NextResponse } from 'next/server';
import { userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { getFestieByUserId } from '@/lib/festie/db';
import { FESTIE_EVENT_TYPES, logFestieEvent } from '@/lib/festie/events';
import { addPlayerCoinsDb } from '@/lib/player/db';
import { GROUND_SCORE_MAX_PICKUP } from '@/lib/groundScore';

export const dynamic = 'force-dynamic';

/** POST — add coins (e.g. Ground Score pickup). */
export async function POST(request: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const userId = userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  try {
    const body = await request.json() as { amount?: unknown };
    const amount = Math.floor(Number(body.amount));
    if (!Number.isFinite(amount) || amount <= 0 || amount > GROUND_SCORE_MAX_PICKUP) {
      return NextResponse.json({ error: `amount must be 1–${GROUND_SCORE_MAX_PICKUP}` }, { status: 400 });
    }

    const coins = await addPlayerCoinsDb(userId, amount);
    const festie = await getFestieByUserId(userId);
    if (festie) {
      logFestieEvent(festie.id, FESTIE_EVENT_TYPES.COIN_PICKUP, {
        amount,
        balance: coins,
      });
    }
    return NextResponse.json({ coins });
  } catch (err) {
    console.error('[api/player/coins POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
