import type { CharacterLoadout } from './types';

export const PARTY_GLOWSTICKS_ID = 'party-glowsticks';

/** True once a vendor item has been bought (persists after unequip). */
export function hasPurchasedLoadoutItem(
  loadout: CharacterLoadout | undefined,
  itemId: string,
): boolean {
  if (!loadout) return false;
  if (loadout.owned?.includes(itemId)) return true;
  // Legacy saves: treat currently equipped as purchased.
  return loadout.hand === itemId;
}

/** Glowstick ambient throws — only while party glowsticks are in the hand slot. */
export function hasGlowsticksEquipped(loadout: CharacterLoadout | undefined): boolean {
  return loadout?.hand === PARTY_GLOWSTICKS_ID;
}
