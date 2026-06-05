import { MID_TILE } from '@/lib/venues';

/** Parallax scroll factors and tile widths for world layers. */
export const SKY_F = 0.08;
export const MID_F = 0.35;
export const GND_F = 1.0;

export const SKY_TILE = 2000;
export { MID_TILE };
export const GND_TILE = 3600;

export const SCENE_HEIGHT = 900;

/** Visible tile indices for infinite horizontal scrolling. */
export function nearTiles(vx: number, tileW: number): number[] {
  const t0 = Math.floor(vx / tileW) - 1;
  return [t0, t0 + 1, t0 + 2];
}
