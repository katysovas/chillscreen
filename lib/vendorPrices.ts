import { loadoutItem } from '@/components/game/characters/loadout/catalog';
import type { VendorShopItemId } from './vendorShop';

/** Coin price shown in Buz's shop — defaults to 100 when unset. */
export function vendorItemPrice(itemId: VendorShopItemId | string): number {
  return loadoutItem(itemId)?.vendorPrice ?? 100;
}
