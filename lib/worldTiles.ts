/** World layout: SF → countryside → Seattle → countryside → SF (repeats). */

export type WorldTileKind = 'sf' | 'seattle' | 'town';

/** Tiles per cycle: 1 SF + 2 town + 1 Seattle + 2 town. */
export const WORLD_TILE_CYCLE = 6;

const SF_SLOT = 0;
const SEATTLE_SLOT = 3;

export function worldTileSlot(tileIndex: number): number {
  return ((tileIndex % WORLD_TILE_CYCLE) + WORLD_TILE_CYCLE) % WORLD_TILE_CYCLE;
}

export function worldTileKind(tileIndex: number): WorldTileKind {
  const slot = worldTileSlot(tileIndex);
  if (slot === SF_SLOT) return 'sf';
  if (slot === SEATTLE_SLOT) return 'seattle';
  return 'town';
}

export function isSeattleTile(tileIndex: number): boolean {
  return worldTileKind(tileIndex) === 'seattle';
}

export function isSanFranciscoTile(tileIndex: number): boolean {
  return worldTileKind(tileIndex) === 'sf';
}

export function isTownTile(tileIndex: number): boolean {
  return worldTileKind(tileIndex) === 'town';
}

/** Nearest tile of a given kind (searches outward from `tileIndex`). */
export function nearestTileOfKind(tileIndex: number, kind: WorldTileKind): number {
  if (worldTileKind(tileIndex) === kind) return tileIndex;
  for (let d = 1; d <= WORLD_TILE_CYCLE; d++) {
    if (worldTileKind(tileIndex - d) === kind) return tileIndex - d;
    if (worldTileKind(tileIndex + d) === kind) return tileIndex + d;
  }
  return tileIndex;
}

/** Deterministic 0..1 jitter per tile (stable across sessions). */
export function tileRand(tile: number, salt: string) {
  let h = tile * 2654435761;
  for (let i = 0; i < salt.length; i++) h = Math.imul(h ^ salt.charCodeAt(i), 2246822519);
  return ((h >>> 0) % 10000) / 10000;
}
