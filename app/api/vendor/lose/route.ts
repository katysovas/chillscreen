import { NextResponse } from 'next/server';
import { loadoutItem } from '@/components/game/characters/loadout/catalog';
import { userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { losePlayerLoadoutItemDb } from '@/lib/player/db';

/** POST — permanently lose a purchased vendor item (autopilot prop loss). */
export async function POST(request: Request) {
  if (!getDb()) {
    return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
  }

  const userId = userIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
  }

  try {
    const body = await request.json() as { itemId?: string; balloonColor?: string };
    const itemId = String(body.itemId ?? '').trim();
    const balloonColor = typeof body.balloonColor === 'string' ? body.balloonColor : '#ef4023';

    if (!loadoutItem(itemId)) {
      return NextResponse.json({ error: 'unknown_item' }, { status: 400 });
    }

    const loadout = await losePlayerLoadoutItemDb(userId, itemId, balloonColor);
    if (!loadout) {
      return NextResponse.json({ error: 'not_owned' }, { status: 400 });
    }

    return NextResponse.json({ loadout });
  } catch (err) {
    console.error('[api/vendor/lose POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
