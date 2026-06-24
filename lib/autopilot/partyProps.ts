import {
  hasPurchasedLoadoutItem,
  type CharacterLoadout,
} from '@/components/game/characters/loadout';
import { loadoutItem } from '@/components/game/characters/loadout/catalog';
import {
  PARTY_CONFETTI_ID,
  PARTY_FIREWORKS_ID,
  PARTY_GLOWSTICKS_ID,
} from '@/components/game/characters/loadout/ownership';
import { vendorItemPrice } from '@/lib/vendorPrices';

export const AUTOPILOT_PARTY_PROP_IDS = [
  PARTY_GLOWSTICKS_ID,
  PARTY_CONFETTI_ID,
  PARTY_FIREWORKS_ID,
] as const;

/** Pick a party favor to flash — buy if needed and affordable. */
export function pickAutopilotPartyProp(
  loadout: CharacterLoadout,
  coins: number,
): { itemId: string; name: string; needsPurchase: boolean } | null {
  const candidates = AUTOPILOT_PARTY_PROP_IDS.filter(id => {
    if (hasPurchasedLoadoutItem(loadout, id)) return true;
    return coins >= vendorItemPrice(id);
  });
  if (candidates.length === 0) return null;
  const itemId = candidates[Math.floor(Math.random() * candidates.length)]!;
  const name = loadoutItem(itemId)?.name ?? 'party gear';
  return {
    itemId,
    name,
    needsPurchase: !hasPurchasedLoadoutItem(loadout, itemId),
  };
}
