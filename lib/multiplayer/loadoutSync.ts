import { normalizeLoadout } from '@/components/game/characters/loadout';
import type { CharacterLoadout } from '@/components/game/characters/loadout';
import type { PlayerLoadoutSync } from './protocol';

/** Strip local-only fields before sending over PartyKit. */
export function serializeLoadout(loadout: CharacterLoadout): PlayerLoadoutSync {
  const sync: PlayerLoadoutSync = {
    hat: loadout.hat ?? null,
    sunglasses: loadout.sunglasses ?? null,
    necklace: loadout.necklace ?? null,
    top: loadout.top ?? null,
    bottom: loadout.bottom ?? null,
    hand: loadout.hand ?? null,
  };
  if (loadout.owned?.length) sync.owned = loadout.owned;
  return sync;
}

/** Rebuild a renderable loadout from networked slot ids + balloon color. */
export function loadoutFromSync(
  sync: PlayerLoadoutSync | undefined,
  balloonColor: string,
): CharacterLoadout {
  return normalizeLoadout(sync ? { ...sync, balloonColor } : undefined, balloonColor);
}

/** Stable string for detecting loadout changes in the RAF loop. */
export function loadoutSyncKey(sync: PlayerLoadoutSync | undefined): string {
  return JSON.stringify(sync ?? {});
}
