import type { CharacterLoadout } from '@/components/game/characters/loadout/types';
import { defaultLoadout, normalizeLoadout } from '@/components/game/characters/loadout/defaults';
import { loadoutItem } from '@/components/game/characters/loadout/catalog';
import { loadoutItemId } from '@/components/game/characters/loadout/types';

const STORAGE_KEY = 'whichstage-player-loadout';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
}

/** Read saved loadout from localStorage (vendor store will write here later). */
export function readPlayerLoadout(): CharacterLoadout | null {
  if (!canUseStorage()) return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CharacterLoadout;
  } catch {
    return null;
  }
}

export function writePlayerLoadout(loadout: CharacterLoadout): void {
  if (!canUseStorage()) return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(loadout));
}

/** Merge persisted slots with the live session balloon color. */
export function getPlayerLoadout(balloonColor: string): CharacterLoadout {
  return normalizeLoadout(readPlayerLoadout() ?? undefined, balloonColor);
}

/** Equip one slot and persist — for vendor UI. */
export function equipLoadoutSlot(
  slot: keyof CharacterLoadout,
  itemId: string | null,
  balloonColor: string,
): CharacterLoadout {
  const next = normalizeLoadout(
    { ...readPlayerLoadout(), [slot]: itemId },
    balloonColor,
  );
  writePlayerLoadout(next);
  return next;
}

/** Equip a catalog item by id and persist to localStorage. */
export function equipLoadoutItem(
  itemId: string,
  balloonColor: string,
): CharacterLoadout | null {
  const def = loadoutItem(itemId);
  if (!def) return null;
  const saved = readPlayerLoadout();
  const owned = new Set([...(saved?.owned ?? []), itemId]);
  const next = normalizeLoadout(
    { ...saved, [def.slot]: itemId, owned: [...owned] },
    balloonColor,
  );
  writePlayerLoadout(next);
  return next;
}

/** Remove a catalog item from its slot if currently equipped. */
export function unequipLoadoutItem(
  itemId: string,
  balloonColor: string,
): CharacterLoadout | null {
  const def = loadoutItem(itemId);
  if (!def) return null;
  const current = getPlayerLoadout(balloonColor);
  if (loadoutItemId(current, def.slot) !== itemId) return null;
  return equipLoadoutSlot(def.slot, null, balloonColor);
}

/** Reset to defaults (keeps balloon color). */
export function resetPlayerLoadout(balloonColor: string): CharacterLoadout {
  const next = defaultLoadout(balloonColor);
  writePlayerLoadout(next);
  return next;
}
