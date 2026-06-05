/** World layout: SF → town → San Diego+Coachella → town → Seattle → town */

export type WorldTileKind = 'sf' | 'town' | 'san_diego' | 'coachella' | 'seattle';

/** Tiles per cycle — 3 cities + 1 dual tile, 3 short towns. */
export const WORLD_TILE_CYCLE = 6;

const SF_SLOT = 0;
const SF_SD_TOWN_SLOT = 1;
/** San Diego bay / skyline + Coachella festival on one tile. */
const SOCAL_SLOT = 2;
const SEATTLE_SLOT = 4;

export function worldTileSlot(tileIndex: number): number {
  return ((tileIndex % WORLD_TILE_CYCLE) + WORLD_TILE_CYCLE) % WORLD_TILE_CYCLE;
}

export function worldTileKind(tileIndex: number): WorldTileKind {
  const slot = worldTileSlot(tileIndex);
  if (slot === SF_SLOT) return 'sf';
  if (slot === SOCAL_SLOT) return 'san_diego';
  if (slot === SEATTLE_SLOT) return 'seattle';
  return 'town';
}

/** Southern California tile hosts both San Diego and Coachella art. */
export function isSouthernCaliforniaTile(tileIndex: number): boolean {
  return worldTileSlot(tileIndex) === SOCAL_SLOT;
}

export function isSeattleTile(tileIndex: number): boolean {
  return worldTileKind(tileIndex) === 'seattle';
}

export function isSanFranciscoTile(tileIndex: number): boolean {
  return worldTileKind(tileIndex) === 'sf';
}

export function isSanDiegoTile(tileIndex: number): boolean {
  return isSouthernCaliforniaTile(tileIndex);
}

export function isCoachellaTile(tileIndex: number): boolean {
  return isSouthernCaliforniaTile(tileIndex);
}

export function isTownTile(tileIndex: number): boolean {
  return worldTileKind(tileIndex) === 'town';
}

/** Compact scrub town between San Francisco and SoCal. */
export function isSfToSdTown(tileIndex: number): boolean {
  return isTownTile(tileIndex) && worldTileSlot(tileIndex) === SF_SD_TOWN_SLOT;
}

/** Nearest tile of a given kind (searches outward from `tileIndex`). */
export function nearestTileOfKind(tileIndex: number, kind: WorldTileKind): number {
  if (worldTileKind(tileIndex) === kind) return tileIndex;
  if (kind === 'coachella' || kind === 'san_diego') {
    if (isSouthernCaliforniaTile(tileIndex)) return tileIndex;
  }
  for (let d = 1; d <= WORLD_TILE_CYCLE; d++) {
    if (worldTileKind(tileIndex - d) === kind) return tileIndex - d;
    if (worldTileKind(tileIndex + d) === kind) return tileIndex + d;
    if ((kind === 'coachella' || kind === 'san_diego') && isSouthernCaliforniaTile(tileIndex - d)) {
      return tileIndex - d;
    }
    if ((kind === 'coachella' || kind === 'san_diego') && isSouthernCaliforniaTile(tileIndex + d)) {
      return tileIndex + d;
    }
  }
  return tileIndex;
}

/** Deterministic 0..1 jitter per tile (stable across sessions). */
export function tileRand(tile: number, salt: string) {
  let h = tile * 2654435761;
  for (let i = 0; i < salt.length; i++) h = Math.imul(h ^ salt.charCodeAt(i), 2246822519);
  return ((h >>> 0) % 10000) / 10000;
}
