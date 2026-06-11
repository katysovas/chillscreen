import { loadoutItem } from '@/components/game/characters/loadout/catalog';
import { normalizeLoadout } from '@/components/game/characters/loadout/defaults';
import {
  LOADOUT_SLOTS,
  loadoutItemId,
  type CharacterLoadout,
  type LoadoutSlot,
} from '@/components/game/characters/loadout/types';

function equippedIds(loadout: CharacterLoadout): string[] {
  return LOADOUT_SLOTS
    .map(slot => loadoutItemId(loadout, slot))
    .filter((id): id is string => Boolean(id));
}

/** Always equippable without purchase (e.g. default balloon). */
export function isFreeLoadoutItem(itemId: string): boolean {
  const def = loadoutItem(itemId);
  return (def?.vendorPrice ?? 0) <= 0;
}

/** All vendor items the account has bought — source of truth for ownership. */
export function ownedItemIds(loadout: CharacterLoadout | undefined): Set<string> {
  const ids = new Set<string>(loadout?.owned ?? []);
  if (!loadout) return ids;
  for (const id of equippedIds(loadout)) {
    if (!isFreeLoadoutItem(id)) ids.add(id);
  }
  return ids;
}

function mergedOwnedIds(
  saved: CharacterLoadout | undefined,
  patch: CharacterLoadout,
): Set<string> {
  const ids = ownedItemIds(saved);
  for (const id of patch.owned ?? []) ids.add(id);
  for (const id of equippedIds(patch)) {
    if (!isFreeLoadoutItem(id)) ids.add(id);
  }
  return ids;
}

function defaultForSlot(slot: LoadoutSlot): string | null {
  return slot === 'hand' ? 'hand-balloon' : null;
}

/** Server-side merge — keeps purchased items; only allows equipping owned (or free) props. */
export function sanitizePlayerLoadout(
  saved: CharacterLoadout | undefined,
  patch: CharacterLoadout,
  balloonColor: string,
): CharacterLoadout {
  const owned = mergedOwnedIds(saved, patch);
  const base = normalizeLoadout(saved, balloonColor);
  const incoming = normalizeLoadout(patch, balloonColor);

  const next: CharacterLoadout = {
    ...base,
    balloonColor: incoming.balloonColor ?? base.balloonColor ?? balloonColor,
    owned: [...owned],
  };

  for (const slot of LOADOUT_SLOTS) {
    const requested = loadoutItemId(incoming, slot);
    if (!requested) {
      next[slot] = defaultForSlot(slot);
      continue;
    }
    if (isFreeLoadoutItem(requested) || owned.has(requested)) {
      next[slot] = requested;
      continue;
    }
    next[slot] = loadoutItemId(base, slot) ?? defaultForSlot(slot);
  }

  return normalizeLoadout(next, balloonColor);
}
