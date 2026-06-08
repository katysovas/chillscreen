import {
  CITY_GND_W,
  CITY_MID_W,
  gndTileAtX,
  midTileAtX,
} from './worldTileGeometry';

/** Parallax scroll factors and tile widths for world layers. */
export const SKY_F = 0.08;
export const MID_F = 0.35;
export const GND_F = 1.0;

export const SKY_TILE = 2000;

/** Default city mid tile width — towns use TOWN_MID_W via worldTileGeometry. */
export const MID_TILE = CITY_MID_W;

export {
  CITY_GND_W,
  CITY_MID_W,
  TOWN_GND_W,
  TOWN_MID_W,
  gndOriginForTile,
  gndWidthForTile,
  gndTileAtX,
  midOriginForTile,
  midWidthForTile,
  midTileAtX,
  nearGndTiles,
  nearMidTiles,
} from './worldTileGeometry';

/** Center mid tile for scroll — matches nearMidTiles viewport sampling. */
export function midScrollTile(worldOff: number): number {
  return midTileAtX(worldOff * MID_F + 700);
}

/** Center ground tile for scroll — matches nearGndTiles viewport sampling. */
export function gndScrollTile(worldOff: number): number {
  return gndTileAtX(worldOff * GND_F + 700);
}

/** @deprecated use CITY_GND_W — kept for legacy callers. */
export const GND_TILE = CITY_GND_W;

export const SCENE_HEIGHT = 900;

/** Visible tile indices for infinite horizontal scrolling (uniform tile width). */
export function nearTiles(vx: number, tileW: number): number[] {
  const t0 = Math.floor(vx / tileW) - 1;
  return [t0, t0 + 1, t0 + 2];
}
