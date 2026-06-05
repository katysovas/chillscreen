import { CITY_GND_W, CITY_MID_W } from './worldTileGeometry';

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
  midOriginForTile,
  midWidthForTile,
  nearGndTiles,
  nearMidTiles,
} from './worldTileGeometry';

/** @deprecated use CITY_GND_W — kept for legacy callers. */
export const GND_TILE = CITY_GND_W;

export const SCENE_HEIGHT = 900;

/** Visible tile indices for infinite horizontal scrolling (uniform tile width). */
export function nearTiles(vx: number, tileW: number): number[] {
  const t0 = Math.floor(vx / tileW) - 1;
  return [t0, t0 + 1, t0 + 2];
}
