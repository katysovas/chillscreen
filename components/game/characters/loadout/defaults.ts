import type { CharacterAccessory } from '../types';
import type { CharacterLoadout } from './types';

/** Default player appearance — heart balloon, no outfit pieces. */
export function defaultLoadout(balloonColor = '#ef4023'): CharacterLoadout {
  return {
    hand: 'hand-balloon',
    balloonColor,
  };
}

/** Necklace-only looks intentionally clear the hand slot. */
function preserveEmptyHand(partial: CharacterLoadout): boolean {
  return Boolean(partial.necklace) && partial.hand === null;
}

function resolveHandSlot(
  partial: CharacterLoadout,
  baseHand: string,
): string | null | undefined {
  if (partial.hand === undefined) return baseHand;
  if (partial.hand === null && !preserveEmptyHand(partial)) return baseHand;
  return partial.hand;
}

/** Merge saved loadout with defaults (keeps balloon color when omitted). */
export function normalizeLoadout(
  partial: CharacterLoadout | undefined,
  balloonColor: string,
): CharacterLoadout {
  const base = defaultLoadout(balloonColor);
  if (!partial) return base;
  return {
    ...base,
    ...partial,
    balloonColor: partial.balloonColor ?? balloonColor,
    hand: resolveHandSlot(partial, base.hand ?? 'hand-balloon'),
  };
}

/**
 * NPC crowd appearance — use the loadout path with the classic heart balloon
 * when there is no equipped hand prop and no legacy accessory override.
 */
export function npcDisplayLoadout(
  loadout: CharacterLoadout | undefined,
  accessory: CharacterAccessory | undefined,
  balloonColor: string,
): CharacterLoadout | undefined {
  if (accessory) return loadout;
  return normalizeLoadout(loadout, balloonColor);
}
