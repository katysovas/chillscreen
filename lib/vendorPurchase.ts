import { loadoutItem } from '@/components/game/characters/loadout/catalog';
import { hasPurchasedLoadoutItem } from '@/components/game/characters/loadout/ownership';
import type { CharacterLoadout } from '@/components/game/characters/loadout/types';
import { deductPlayerCoins, getPlayerCoins } from './playerCoins';
import { equipLoadoutItem, getPlayerLoadout } from './playerLoadout';

export type VendorPurchaseResult =
  | { ok: true; loadout: CharacterLoadout; coins: number; charged: boolean }
  | { ok: false; reason: 'unknown_item' | 'insufficient_coins' };

/** Buy (or re-equip owned) a vendor item — coins deducted on first purchase only. */
export function purchaseVendorItem(
  itemId: string,
  balloonColor: string,
): VendorPurchaseResult {
  const def = loadoutItem(itemId);
  if (!def) return { ok: false, reason: 'unknown_item' };

  const current = getPlayerLoadout(balloonColor);
  if (hasPurchasedLoadoutItem(current, itemId)) {
    const loadout = equipLoadoutItem(itemId, balloonColor);
    if (!loadout) return { ok: false, reason: 'unknown_item' };
    return { ok: true, loadout, coins: getPlayerCoins(), charged: false };
  }

  const price = def.vendorPrice ?? 0;
  if (getPlayerCoins() < price) {
    return { ok: false, reason: 'insufficient_coins' };
  }

  if (deductPlayerCoins(price) === null) {
    return { ok: false, reason: 'insufficient_coins' };
  }

  const loadout = equipLoadoutItem(itemId, balloonColor);
  if (!loadout) return { ok: false, reason: 'unknown_item' };

  return { ok: true, loadout, coins: getPlayerCoins(), charged: true };
}
