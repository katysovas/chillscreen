import { NextResponse } from 'next/server';
import { userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import { getFestieByUserId, toFestieOwner } from '@/lib/festie/db';
import {
  ensureSuperAdminTestCoins,
  getPlayerProfile,
  savePlayerLoadout,
} from '@/lib/player/db';
import type { CharacterLoadout } from '@/components/game/characters/loadout/types';

export const dynamic = 'force-dynamic';

function unauthorized() {
  return NextResponse.json({ error: 'Sign in required' }, { status: 401 });
}

function dbUnavailable() {
  return NextResponse.json({ error: 'DATABASE_URL is not configured' }, { status: 503 });
}

/** GET — signed-in player profile (name, coins, loadout). */
export async function GET(request: Request) {
  if (!getDb()) return dbUnavailable();
  const userId = userIdFromRequest(request);
  if (!userId) return unauthorized();

  try {
    const profile = await getPlayerProfile(userId);
    if (!profile) return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    const festie = await getFestieByUserId(userId);
    const coins = (await ensureSuperAdminTestCoins(userId, festie?.name)) ?? profile.coins;
    return NextResponse.json({
      userId,
      name: profile.name,
      coins,
      loadout: profile.loadout,
      festie: festie ? toFestieOwner(festie) : null,
    });
  } catch (err) {
    console.error('[api/player GET]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

/** PATCH — persist loadout (equip / unequip). */
export async function PATCH(request: Request) {
  if (!getDb()) return dbUnavailable();
  const userId = userIdFromRequest(request);
  if (!userId) return unauthorized();

  try {
    const body = await request.json() as { loadout?: CharacterLoadout; balloonColor?: string };
    if (!body.loadout || typeof body.loadout !== 'object') {
      return NextResponse.json({ error: 'loadout is required' }, { status: 400 });
    }
    const balloonColor = typeof body.balloonColor === 'string' ? body.balloonColor : '#ef4023';
    const saved = await savePlayerLoadout(userId, body.loadout, balloonColor);
    return NextResponse.json({ loadout: saved });
  } catch (err) {
    console.error('[api/player PATCH]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
