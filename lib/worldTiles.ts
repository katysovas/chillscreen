/** World layout: SF → town → Vegas → town → SoCal → town → Tentaroo → town → Forest → town → Seattle → town */

export type WorldTileKind =
  | 'sf'
  | 'town'
  | 'san_diego'
  | 'coachella'
  | 'tentaroo'
  | 'forest'
  | 'seattle'
  | 'vegas';

/** Tiles per cycle — 6 cities + 6 short towns. */
export const WORLD_TILE_CYCLE = 12;

const SF_SLOT = 0;
const SF_VEGAS_TOWN_SLOT = 1;
const VEGAS_SLOT = 2;
const VEGAS_SD_TOWN_SLOT = 3;
/** San Diego bay / skyline + Coachella festival on one tile. */
const SOCAL_SLOT = 4;
const SOCAL_TENTAROO_TOWN_SLOT = 5;
const TENTAROO_SLOT = 6;
const TENTAROO_FOREST_TOWN_SLOT = 7;
/** Electric Forest — glowing woods city. */
const FOREST_SLOT = 8;
const FOREST_SEATTLE_TOWN_SLOT = 9;
const SEATTLE_SLOT = 10;
const SEATTLE_EAST_TOWN_SLOT = 11;

export function worldTileSlot(tileIndex: number): number {
  return ((tileIndex % WORLD_TILE_CYCLE) + WORLD_TILE_CYCLE) % WORLD_TILE_CYCLE;
}

export function worldTileKind(tileIndex: number): WorldTileKind {
  const slot = worldTileSlot(tileIndex);
  if (slot === SF_SLOT) return 'sf';
  if (slot === VEGAS_SLOT) return 'vegas';
  if (slot === SOCAL_SLOT) return 'san_diego';
  if (slot === TENTAROO_SLOT) return 'tentaroo';
  if (slot === FOREST_SLOT) return 'forest';
  if (slot === SEATTLE_SLOT) return 'seattle';
  return 'town';
}

/** Southern California tile hosts both San Diego and Coachella art. */
export function isSouthernCaliforniaTile(tileIndex: number): boolean {
  return worldTileSlot(tileIndex) === SOCAL_SLOT;
}

export function isTentarooTile(tileIndex: number): boolean {
  return worldTileKind(tileIndex) === 'tentaroo';
}

export function isForestTile(tileIndex: number): boolean {
  return worldTileKind(tileIndex) === 'forest';
}

export function isSeattleTile(tileIndex: number): boolean {
  return worldTileKind(tileIndex) === 'seattle';
}

export function isSanFranciscoTile(tileIndex: number): boolean {
  return worldTileKind(tileIndex) === 'sf';
}

export function isVegasTile(tileIndex: number): boolean {
  return worldTileKind(tileIndex) === 'vegas';
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

/** Compact scrub town between San Francisco and Las Vegas. */
export function isSfToVegasTown(tileIndex: number): boolean {
  return isTownTile(tileIndex) && worldTileSlot(tileIndex) === SF_VEGAS_TOWN_SLOT;
}

/** Compact desert town between Las Vegas and SoCal. */
export function isVegasToSdTown(tileIndex: number): boolean {
  return isTownTile(tileIndex) && worldTileSlot(tileIndex) === VEGAS_SD_TOWN_SLOT;
}

/** Compact desert town between SoCal and Tentaroo. */
export function isSocalToTentarooTown(tileIndex: number): boolean {
  return isTownTile(tileIndex) && worldTileSlot(tileIndex) === SOCAL_TENTAROO_TOWN_SLOT;
}

/** Connector town between Tentaroo and The Forest. */
export function isTentarooToForestTown(tileIndex: number): boolean {
  return isTownTile(tileIndex) && worldTileSlot(tileIndex) === TENTAROO_FOREST_TOWN_SLOT;
}

/** Connector town between The Forest and Seattle. */
export function isForestToSeattleTown(tileIndex: number): boolean {
  return isTownTile(tileIndex) && worldTileSlot(tileIndex) === FOREST_SEATTLE_TOWN_SLOT;
}

/** @deprecated Use isTentarooToForestTown / isForestToSeattleTown */
export function isTentarooToSeattleTown(tileIndex: number): boolean {
  return isTentarooToForestTown(tileIndex);
}

/** @deprecated Use isSfToVegasTown */
export function isSfToSdTown(tileIndex: number): boolean {
  return isSfToVegasTown(tileIndex);
}

/** @deprecated Use isTentarooToSeattleTown */
export function isSocalSeattleTown(tileIndex: number): boolean {
  return isTentarooToSeattleTown(tileIndex);
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

/** Cities that host a music stage (concert venue): San Francisco + Seattle. */
function isStageCityTile(tileIndex: number): boolean {
  const k = worldTileKind(tileIndex);
  return k === 'sf' || k === 'seattle';
}

/** Nearest SF-or-Seattle tile — the concert stage lives on both. */
export function nearestStageCityTile(tileIndex: number): number {
  if (isStageCityTile(tileIndex)) return tileIndex;
  for (let d = 1; d <= WORLD_TILE_CYCLE; d++) {
    if (isStageCityTile(tileIndex - d)) return tileIndex - d;
    if (isStageCityTile(tileIndex + d)) return tileIndex + d;
  }
  return tileIndex;
}

/** Deterministic 0..1 jitter per tile (stable across sessions). */
export function tileRand(tile: number, salt: string) {
  let h = tile * 2654435761;
  for (let i = 0; i < salt.length; i++) h = Math.imul(h ^ salt.charCodeAt(i), 2246822519);
  return ((h >>> 0) % 10000) / 10000;
}
