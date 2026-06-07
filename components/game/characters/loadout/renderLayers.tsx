import type { ReactNode } from 'react';
import { buildRenderCtx, renderLoadoutItem, renderLoadoutSlot } from './registry';
import type { CharacterLoadout } from './types';
import { normalizeLoadout } from './defaults';

function color(loadout: CharacterLoadout): string {
  return loadout.balloonColor ?? '#ef4023';
}

/** Floating balloon — only when hand slot is the default balloon. */
export function renderLoadoutFloat(loadout: CharacterLoadout): ReactNode {
  const id = loadout.hand ?? 'hand-balloon';
  if (id !== 'hand-balloon') return null;
  return renderLoadoutItem(id, buildRenderCtx(id, color(loadout)));
}

export function renderLoadoutHat(loadout: CharacterLoadout): ReactNode {
  return renderLoadoutSlot('hat', loadout.hat, color(loadout));
}

export function renderLoadoutSunglasses(loadout: CharacterLoadout): ReactNode {
  return renderLoadoutSlot('sunglasses', loadout.sunglasses, color(loadout));
}

export function renderLoadoutNecklace(loadout: CharacterLoadout): ReactNode {
  return renderLoadoutSlot('necklace', loadout.necklace, color(loadout));
}

export function renderLoadoutTop(loadout: CharacterLoadout): ReactNode {
  if (loadout.bottom === 'bottom-dress') return null;
  return renderLoadoutSlot('top', loadout.top, color(loadout));
}

export function renderLoadoutBottom(loadout: CharacterLoadout): ReactNode {
  return renderLoadoutSlot('bottom', loadout.bottom, color(loadout));
}

/** Hand-held items (mic, saber) — balloon renders in the float layer. */
export function renderLoadoutHand(loadout: CharacterLoadout): ReactNode {
  const id = loadout.hand;
  if (!id || id === 'hand-balloon') return null;
  return renderLoadoutSlot('hand', id, color(loadout));
}

export function resolveLoadout(
  loadout: CharacterLoadout | undefined,
  balloonColor: string,
): CharacterLoadout {
  return normalizeLoadout(loadout, balloonColor);
}
