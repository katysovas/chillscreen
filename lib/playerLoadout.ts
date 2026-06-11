'use client';

import type { CharacterLoadout } from '@/components/game/characters/loadout/types';
import { defaultLoadout } from '@/components/game/characters/loadout/defaults';
import { loadoutItem } from '@/components/game/characters/loadout/catalog';
import {
  getPlayerLoadout as getSessionLoadout,
  unequipLoadoutItem as unequipSessionItem,
} from '@/lib/player/session';

export function getPlayerLoadout(balloonColor: string): CharacterLoadout {
  return getSessionLoadout(balloonColor);
}

export async function unequipLoadoutItem(
  itemId: string,
  balloonColor: string,
): Promise<CharacterLoadout | null> {
  return unequipSessionItem(itemId, balloonColor);
}

/** Equip a catalog item by id — prefer purchaseVendorItem for vendor flow. */
export function equipLoadoutItem(
  itemId: string,
  balloonColor: string,
): CharacterLoadout | null {
  const def = loadoutItem(itemId);
  if (!def) return null;
  // Vendor purchases go through the API; direct equip is unused in-game.
  return getPlayerLoadout(balloonColor);
}

export function resetPlayerLoadout(balloonColor: string): CharacterLoadout {
  return defaultLoadout(balloonColor);
}
