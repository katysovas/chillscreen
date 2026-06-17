import { minStageScale } from '@/lib/stageViewport';
import { STAGE_TOILET } from '@/lib/stageToilets';
import { VIEW_CENTER_X, VIEW_WIDTH } from '@/lib/venues';

export const CREATOR_SCENE_HREF = '/images/cities/creator-cinema-scene.svg?v=1';

export const CITY_MID_TILE_W = 2600;
export const CITY_MID_TILE_H = 900;

/** Ground / road line on the mid tile. */
export const TENTAROO_GND = 660;

/** Fallback fill behind photos — matches night sky edge tone. */
export const CITY_BACKDROP_FILL = '#0a0610';

/** City template — grass + sidewalk props sit this many px lower than default GND_Y. */
export const CITY_GRASS_DROP_Y = 30;

/** City template — porta-potties sit this many px below the default sidewalk Y. */
export const CITY_TOILET_DROP_Y = 40;

export const WHICH_STAGE_MID_X = 1620;

/** Mid-layer slice shown when the city template uses a fixed camera (stage-centered). */
export const CITY_STATIC_VIEWPORT_X = WHICH_STAGE_MID_X - VIEW_CENTER_X;
export const CITY_STATIC_VIEWPORT_W = VIEW_WIDTH;

export const WHICH_STAGE_SCALE = minStageScale(1.95);

export const WHICH_STAGE_PUSH_Y = 88;

/** Nature rig truss (City foreground uses ChillStage). */
export const WHICH_STAGE_TRUSS_Y = 322;
/** Stage name baseline — above the truss. */
export const WHICH_STAGE_TITLE_Y = 312;

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
