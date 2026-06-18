import {
  hasPurchasedLoadoutItem,
  type CharacterLoadout,
} from '@/components/game/characters/loadout';
import { VENDOR_SHOP_ITEMS } from '@/lib/vendorShop';
import { vendorItemPrice } from '@/lib/vendorPrices';

/** Pick an affordable unowned vendor item for autopilot shopping. */
export function pickAutopilotVendorItem(
  coins: number,
  loadout: CharacterLoadout,
): string | null {
  const affordable = VENDOR_SHOP_ITEMS.filter(id => {
    const price = vendorItemPrice(id);
    if (hasPurchasedLoadoutItem(loadout, id)) return price > 0;
    return coins >= price;
  });
  if (affordable.length === 0) return null;
  return affordable[Math.floor(Math.random() * affordable.length)]!;
}
