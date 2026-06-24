import {
  hasPurchasedLoadoutItem,
  type CharacterLoadout,
} from '@/components/game/characters/loadout';
import { VENDOR_SHOP_ITEMS } from '@/lib/vendorShop';
import { vendorItemPrice } from '@/lib/vendorPrices';

/** Max wait before the next prop loss — actual delay is random within this window. */
export const AUTOPILOT_PROP_LOSS_WINDOW_MS = 10 * 60 * 1000;

export function nextAutopilotPropLossAtMs(now = Date.now()): number {
  return now + Math.random() * AUTOPILOT_PROP_LOSS_WINDOW_MS;
}

/** Pick a random purchased vendor prop to lose — null when nothing owned. */
export function pickOwnedVendorPropToLose(loadout: CharacterLoadout): string | null {
  const candidates = VENDOR_SHOP_ITEMS.filter(id => {
    const price = vendorItemPrice(id);
    return price > 0 && hasPurchasedLoadoutItem(loadout, id);
  });
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)]!;
}
