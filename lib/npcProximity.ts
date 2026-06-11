/** % of viewport width — player must be this close to greet an NPC. */
export const NPC_TOUCH_DIST_VW = 0.05;

/** Looser threshold for NPC↔NPC pair convos (wandering cast rarely overlaps greet range). */
export const NPC_PAIR_DIST_VW = 0.28;

export function npcTouchDistPx(viewportWidth: number): number {
  return NPC_TOUCH_DIST_VW * viewportWidth;
}

export function npcPairDistPx(viewportWidth: number): number {
  return NPC_PAIR_DIST_VW * viewportWidth;
}

export function npcsAreCloseEnough(
  worldXA: number,
  worldXB: number,
  viewportWidth: number,
): boolean {
  if (!Number.isFinite(worldXA) || !Number.isFinite(worldXB)) return false;
  return Math.abs(worldXA - worldXB) < npcTouchDistPx(viewportWidth);
}

export function npcsAreCloseEnoughForPair(
  worldXA: number,
  worldXB: number,
  viewportWidth: number,
): boolean {
  if (!Number.isFinite(worldXA) || !Number.isFinite(worldXB)) return false;
  return Math.abs(worldXA - worldXB) < npcPairDistPx(viewportWidth);
}

export type NpcPosition = { id: string; worldX: number };
