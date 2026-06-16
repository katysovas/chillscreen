import { minStageScale } from '@/lib/stageViewport';

export const CREATOR_SCENE_HREF = '/images/cities/creator-cinema-scene.svg?v=1';

export const CITY_BLEND_HREF = '/images/city/city-blend.jpg';
export const CITY_SKYLINE_HREF = '/images/city/city-skyline.jpg';

export const CITY_MID_TILE_W = 2600;
export const CITY_MID_TILE_H = 900;

/** Ground / road line on the mid tile. */
export const TENTAROO_GND = 660;

/** Skyline photo horizontal framing (positive = shift image left). */
export const CITY_SKYLINE_OFFSET_X = 100;

/**
 * Lift user-uploaded skyline photos so the image bottom aligns with the road
 * (ground at y={@link TENTAROO_GND}) instead of the mid-tile bottom.
 */
export const CITY_UPLOAD_BACKDROP_LIFT_Y = CITY_MID_TILE_H - TENTAROO_GND;

export function isCustomCityBackdropUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const base = url.split('?')[0]?.split('#')[0] ?? '';
  return base !== CITY_SKYLINE_HREF.split('?')[0];
}

/** Extra width each side so framing shifts never expose seams. */
export const CITY_SKYLINE_BLEED_X = 200;

/** Fallback fill behind photos — matches night sky edge tone. */
export const CITY_BACKDROP_FILL = '#0a0610';

export const WHICH_STAGE_MID_X = 1620;

export const WHICH_STAGE_SCALE = minStageScale(1.95);

export const WHICH_STAGE_PUSH_Y = 88;

/** Nature rig truss (City foreground uses ChillStage). */
export const WHICH_STAGE_TRUSS_Y = 322;
/** Stage name baseline — above the truss. */
export const WHICH_STAGE_TITLE_Y = 312;

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
