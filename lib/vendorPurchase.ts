import type { CharacterLoadout } from '@/components/game/characters/loadout/types';
import {
  purchaseVendorItem,
  type VendorPurchaseResult,
} from '@/lib/player/session';

export type { VendorPurchaseResult };

/** Buy (or re-equip owned) a vendor item — persisted in DB when signed in. */
export function purchaseVendorItemAsync(
  itemId: string,
  balloonColor: string,
): Promise<VendorPurchaseResult> {
  return purchaseVendorItem(itemId, balloonColor);
}
