import { WORLD_TILE_CYCLE, worldTileSlot } from './worldTiles';

/** Full-width city tiles (mid / ground). */
export const CITY_MID_W = 2600;
export const CITY_GND_W = 3600;

/** Compact town connectors — short hops between cities (content scales to fit). */
export const TOWN_MID_W = 820;
export const TOWN_GND_W = 1160;

const MID_W_BY_SLOT = [
  CITY_MID_W, TOWN_MID_W, CITY_MID_W, TOWN_MID_W,
  CITY_MID_W, TOWN_MID_W, CITY_MID_W, TOWN_MID_W, CITY_MID_W, TOWN_MID_W,
] as const;
const GND_W_BY_SLOT = [
  CITY_GND_W, TOWN_GND_W, CITY_GND_W, TOWN_GND_W,
  CITY_GND_W, TOWN_GND_W, CITY_GND_W, TOWN_GND_W, CITY_GND_W, TOWN_GND_W,
] as const;

export function midWidthForSlot(slot: number): number {
  return MID_W_BY_SLOT[((slot % WORLD_TILE_CYCLE) + WORLD_TILE_CYCLE) % WORLD_TILE_CYCLE]!;
}

export function gndWidthForSlot(slot: number): number {
  return GND_W_BY_SLOT[((slot % WORLD_TILE_CYCLE) + WORLD_TILE_CYCLE) % WORLD_TILE_CYCLE]!;
}

export function midWidthForTile(tileIndex: number): number {
  return midWidthForSlot(worldTileSlot(tileIndex));
}

export function gndWidthForTile(tileIndex: number): number {
  return gndWidthForSlot(worldTileSlot(tileIndex));
}

export function midCycleWidth(): number {
  return MID_W_BY_SLOT.reduce((a, b) => a + b, 0);
}

export function gndCycleWidth(): number {
  return GND_W_BY_SLOT.reduce((a, b) => a + b, 0);
}

function tileOrigin(tileIndex: number, widthForSlot: (slot: number) => number, cycleWidth: number): number {
  const cycle = WORLD_TILE_CYCLE;
  const slot = worldTileSlot(tileIndex);
  const cycles = Math.floor(tileIndex / cycle);
  let prefix = 0;
  for (let s = 0; s < slot; s++) prefix += widthForSlot(s);
  return cycles * cycleWidth + prefix;
}

export function midOriginForTile(tileIndex: number): number {
  return tileOrigin(tileIndex, midWidthForSlot, midCycleWidth());
}

export function gndOriginForTile(tileIndex: number): number {
  return tileOrigin(tileIndex, gndWidthForSlot, gndCycleWidth());
}

function tileAtX(x: number, originForTile: (t: number) => number): number {
  const cycle = WORLD_TILE_CYCLE;
  const cycleW = originForTile(cycle) - originForTile(0);
  let t = Math.floor(x / cycleW) * cycle;
  while (originForTile(t + 1) <= x) t++;
  while (originForTile(t) > x) t--;
  return t;
}

/** Mid-layer tile index containing viewport x. */
export function midTileAtX(vx: number): number {
  return tileAtX(vx, midOriginForTile);
}

/** Ground tile index containing x. */
export function gndTileAtX(x: number): number {
  return tileAtX(x, gndOriginForTile);
}

/** Tile indices visible around vx (variable-width mid layer). */
export function nearMidTiles(vx: number): number[] {
  const t = midTileAtX(vx + 700);
  return [t - 1, t, t + 1];
}

/** Tile indices visible around ground x. */
export function nearGndTiles(x: number): number[] {
  const t = gndTileAtX(x + 700);
  return [t - 1, t, t + 1];
}
