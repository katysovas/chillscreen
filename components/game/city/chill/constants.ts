import { CHILL_FOREST_BG } from '@/lib/creatorVenueBackdrop';
import { minStageScale } from '@/lib/stageViewport';
import { STAGE_TOILET } from '@/lib/stageToilets';

export { CHILL_FOREST_BG };

/** Mid-layer scene art — customize per template folder. */
export const CREATOR_SCENE_HREF = '/images/cities/creator-chill-scene.svg?v=1';

export const CHILL_MID_TILE_W = 2600;
export const CHILL_MID_TILE_H = 900;

export const CHILL_FOREST_LAYERS = [
  '/images/chill/forest_1.svg',
  '/images/chill/forest_2.svg',
  '/images/chill/forest_3.svg',
  '/images/chill/forest_4.svg',
  '/images/chill/forest_5.svg',
  '/images/chill/forest_6.svg',
] as const;

/** Truss stage name color. */
export const CHILL_STAGE_TITLE_COLOR = '#2e3d45';

/** Grass + sidewalk props sit this many px lower than default GND_Y. */
export const CHILL_GRASS_DROP_Y = 52;

/** Ground line on creator Chill tiles (farm-derived layout). */
export const TENTAROO_GND = 660;

/** Main stage center x on Chill tiles. */
export const WHICH_STAGE_MID_X = 1620;

export const WHICH_STAGE_SCALE = minStageScale(1.95);

export const WHICH_STAGE_PUSH_Y = 88;

/** Chill rig layout — unscaled coords anchored at TENTAROO_GND. */
export const WHICH_STAGE_TRUSS_Y = 322;
export const WHICH_STAGE_STREAM_LABEL_Y = 358;
export const WHICH_STAGE_SPEAKER_Y = 358;
export const WHICH_STAGE_SCREEN_Y = 406;

/** Landing hero — gap below truss before speaker/screen row (tops aligned). */
export const WHICH_STAGE_HERO_ROW_GAP = 10;

/** Landing hero — push speakers/screen below the nav (unscaled rig coords). */
export const WHICH_STAGE_HERO_NAV_GAP = 40;

const WHICH_STAGE_W = 500;

export const WHICH_STAGE_HALF = Math.ceil((WHICH_STAGE_W * WHICH_STAGE_SCALE) / 2) + 28;

export const WHICH_STAGE_TOILET_HALF =
  Math.ceil((480 * WHICH_STAGE_SCALE) / 2) + STAGE_TOILET.stageHalfBleed;

export const WHICH_NEON = {
  green: '#38f5b0',
  cyan: '#2fe6ff',
  magenta: '#ff4fd8',
  amber: '#ffc14d',
  violet: '#9b6bff',
  edge: 'rgba(56,245,176,.55)',
} as const;
