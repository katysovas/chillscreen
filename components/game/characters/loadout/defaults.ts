import type { CharacterLoadout } from './types';

/** Default player appearance — heart balloon, no outfit pieces. */
export function defaultLoadout(balloonColor = '#ef4023'): CharacterLoadout {
  return {
    hand: 'hand-balloon',
    balloonColor,
  };
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
    hand: partial.hand === undefined ? base.hand : partial.hand,
  };
}
