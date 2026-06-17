import { minStageScale } from '@/lib/stageViewport';
import { STAGE_TOILET } from '@/lib/stageToilets';

/** Ground line on Forest tiles. */
export const FOREST_GND = 660;

/** The Forest Stage — glowing woods main stage, center of the tile. */
export const FOREST_STAGE_MID_X = 1500;

export const FOREST_MID_TILE_W = 2600;
export const FOREST_MID_TILE_H = 900;

/** Mid-layer slice when the camera is fixed on the stage (matches lib/venues VIEW_*). */
export const FOREST_STATIC_VIEWPORT_X = FOREST_STAGE_MID_X - 700;
export const FOREST_STATIC_VIEWPORT_W = 1400;

/** Fallback fill behind the scene photo — matches dark treeline edge tone. */
export const FOREST_BACKDROP_FILL = '#0a1812';

/** Grass + sidewalk props sit this many px lower than default GND_Y. */
export const FOREST_GRASS_DROP_Y = 30;

/** Porta-potties sit this many px below the default sidewalk Y. */
export const FOREST_TOILET_DROP_Y = 40;

export const FOREST_STAGE_SCALE = minStageScale(1.95);

export const FOREST_STAGE_PUSH_Y = 88;

/** Static viewport — smaller rig so canopy + lasers fit in frame. */
export const STATIC_FOREST_STAGE_SCALE = minStageScale(1.62);

export const STATIC_FOREST_STAGE_PUSH_Y = 64;

const FOREST_STAGE_W = 500;

/** Half-width for in-view / focus checks (scaled rig + crowd bleed). */
export const FOREST_STAGE_HALF = Math.ceil((FOREST_STAGE_W * FOREST_STAGE_SCALE) / 2) + 28;

/** Scaled deck half-width — lines up porta-potties with the visible stage edge. */
export const FOREST_STAGE_TOILET_HALF =
  Math.ceil((480 * STATIC_FOREST_STAGE_SCALE) / 2) + STAGE_TOILET.stageHalfBleed;

/** Electric-forest palette — lasers, fireflies, glowing shrooms. */
export const FOREST_NEON = {
  green: '#39ff88',
  cyan: '#4fd8ff',
  magenta: '#ff4fd8',
  amber: '#ffd98a',
  violet: '#b07bff',
  mint: '#58f5c9',
  edge: 'rgba(45,212,160,.55)',
} as const;
