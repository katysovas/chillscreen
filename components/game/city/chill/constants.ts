import { minStageScale } from '@/lib/stageViewport';

/** Mid-layer scene art — customize per template folder. */
export const CREATOR_SCENE_HREF = '/images/cities/creator-chill-scene.svg?v=1';

/** Chill forest backdrop — mint field behind parallax trees. */
export const CHILL_FOREST_BG = '#D1EBD4';

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

const WHICH_STAGE_W = 500;

export const WHICH_STAGE_HALF = Math.ceil((WHICH_STAGE_W * WHICH_STAGE_SCALE) / 2) + 28;

export const WHICH_STAGE_TOILET_HALF = Math.ceil((480 * WHICH_STAGE_SCALE) / 2) + 12;

export const WHICH_NEON = {
  green: '#38f5b0',
  cyan: '#2fe6ff',
  magenta: '#ff4fd8',
  amber: '#ffc14d',
  violet: '#9b6bff',
  edge: 'rgba(56,245,176,.55)',
} as const;
