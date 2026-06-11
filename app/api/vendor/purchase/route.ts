import { NextResponse } from 'next/server';
import { loadoutItem } from '@/components/game/characters/loadout/catalog';
import { hasPurchasedLoadoutItem } from '@/components/game/characters/loadout/ownership';
import type { CharacterLoadout } from '@/components/game/characters/loadout/types';
import { userIdFromRequest } from '@/lib/auth/session';
import { getDb } from '@/lib/db';
import {
  getPlayerProfile,
  mergeLoadoutForBalloon,
  purchaseVendorItemDb,
  savePlayerLoadout,
} from '@/lib/player/db';

export const dynamic = 'force-dynamic';

function equipOwned(
  current: CharacterLoadout,
  itemId: string,
  balloonColor: string,
): CharacterLoadout | null {
  const def = loadoutItem(itemId);
  if (!def) return null;
  const owned = new Set([...(current.owned ?? []), itemId]);
  return mergeLoadoutForBalloon(
    { ...current, [def.slot]: itemId, owned: [...owned] },
    balloonColor,
  );
}

/** POST — buy or re-equip a vendor item (server-authoritative coins). */
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

    const def = loadoutItem(itemId);
    if (!def) {
      return NextResponse.json({ error: 'unknown_item' }, { status: 400 });
    }

    const profile = await getPlayerProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    const current = mergeLoadoutForBalloon(profile.loadout, balloonColor);

    if (hasPurchasedLoadoutItem(current, itemId)) {
      const loadout = equipOwned(current, itemId, balloonColor);
      if (!loadout) {
        return NextResponse.json({ error: 'unknown_item' }, { status: 400 });
      }
      const saved = await savePlayerLoadout(userId, loadout, balloonColor);
      return NextResponse.json({ loadout: saved, coins: profile.coins, charged: false });
    }

    const price = def.vendorPrice ?? 0;
    if (profile.coins < price) {
      return NextResponse.json({ error: 'insufficient_coins' }, { status: 402 });
    }

    const loadout = equipOwned(current, itemId, balloonColor);
    if (!loadout) {
      return NextResponse.json({ error: 'unknown_item' }, { status: 400 });
    }

    const purchased = await purchaseVendorItemDb(userId, loadout, price, balloonColor);
    if (!purchased) {
      return NextResponse.json({ error: 'insufficient_coins' }, { status: 402 });
    }

    return NextResponse.json({
      loadout: purchased.loadout,
      coins: purchased.coins,
      charged: true,
    });
  } catch (err) {
    console.error('[api/vendor/purchase POST]', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
