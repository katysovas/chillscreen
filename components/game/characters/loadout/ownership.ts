import { equippedLoadoutItemIds } from './registry';
import type { CharacterLoadout } from './types';
import { isFreeLoadoutItem } from '@/lib/player/loadoutValidation';

export const PARTY_GLOWSTICKS_ID = 'party-glowsticks';
export const PARTY_STICKER_ID = 'party-sticker';
export const PARTY_CONFETTI_ID = 'party-confetti';
export const PARTY_FIREWORKS_ID = 'party-fireworks';

/** True once a vendor item has been bought (persists after unequip). */
export function hasPurchasedLoadoutItem(
  loadout: CharacterLoadout | undefined,
  itemId: string,
): boolean {
  if (!loadout) return false;
  if (isFreeLoadoutItem(itemId)) return true;
  if (loadout.owned?.includes(itemId)) return true;
  // Legacy saves: treat any equipped vendor item as purchased.
  return equippedLoadoutItemIds(loadout).includes(itemId);
}

/** Glowstick ambient throws — only while party glowsticks are in the hand slot. */
export function hasGlowsticksEquipped(loadout: CharacterLoadout | undefined): boolean {
  return loadout?.hand === PARTY_GLOWSTICKS_ID;
}

/** Psychedelic screen bursts — while the mystery sticker is in owned. */
export function hasStickerTripActive(loadout: CharacterLoadout | undefined): boolean {
  if (!loadout) return false;
  return loadout.owned?.includes(PARTY_STICKER_ID) ?? false;
}

/** @deprecated use hasStickerTripActive */
export function hasStickerEquipped(loadout: CharacterLoadout | undefined): boolean {
  return loadout?.hand === PARTY_STICKER_ID;
}

/** Confetti cannon bursts — while confetti cannon is in the hand slot. */
export function hasConfettiEquipped(loadout: CharacterLoadout | undefined): boolean {
  return loadout?.hand === PARTY_CONFETTI_ID;
}

/** Fireworks overlay — while the fireworks item is in the hand slot. */
export function hasFireworksEquipped(loadout: CharacterLoadout | undefined): boolean {
  return loadout?.hand === PARTY_FIREWORKS_ID;
}
