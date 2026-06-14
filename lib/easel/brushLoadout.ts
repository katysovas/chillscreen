import type { CharacterLoadout } from '@/components/game/characters/loadout';

/** Hand prop while an NPC is painting on the easel. */
export const EASEL_HAND_BRUSH_ID = 'hand-brush';

/** Swap hand prop to paintbrush while drawing; restore base loadout when not. */
export function easelHandLoadout(
  base: CharacterLoadout | undefined,
  useBrush: boolean,
): CharacterLoadout | undefined {
  if (!useBrush) return base;
  return { ...(base ?? {}), hand: EASEL_HAND_BRUSH_ID };
}
