import { minStageScale } from '@/lib/stageViewport';

export const VEGAS_GND = 660;
export const VEGAS_MID_TILE_W = 2600;
export const VEGAS_MID_TILE_H = 900;

/** EDC "Electric Daze" rave megastage center x on Vegas tiles (scrolling city). */
export const EDC_STAGE_MID_X = 2270;

/** Display scale for the EDC rig + video (matches other venue ~2× boost). */
export const EDC_STAGE_SCALE = minStageScale(2.1);

/**
 * Fixed-camera Las Vegas — smaller rig west of the Sphere so the Strip
 * skyline (Luxor → Sphere → High Roller) stays in frame.
 */
export const EDC_STATIC_STAGE_MID_X = 700;
export const EDC_STATIC_STAGE_SCALE = minStageScale(1.4);

/** EDC-only vertical nudge — less than concert stages so the owl arch banner fits. */
export const EDC_STAGE_PUSH_Y = 16;

/** Rig width (deck + arch wings + crowd bleed) for in-view / focus checks. */
const EDC_STAGE_W = 760;

/** Half-width for in-view / focus checks (scrolling city). */
export const EDC_STAGE_HALF = Math.ceil((EDC_STAGE_W * EDC_STAGE_SCALE) / 2) + 24;

/** Half-width on the static /lasvegas page (smaller scale). */
export const EDC_STATIC_STAGE_HALF =
  Math.ceil((EDC_STAGE_W * EDC_STATIC_STAGE_SCALE) / 2) + 24;

/** Mid-layer slice when the camera is fixed on the stage (matches lib/venues VIEW_*). */
export const VEGAS_STATIC_VIEWPORT_X = EDC_STATIC_STAGE_MID_X - 700;
export const VEGAS_STATIC_VIEWPORT_W = 1400;

/** Animated Sphere — sits west of the static stage (scrolling tile keeps cx≈1470). */
export const VEGAS_STATIC_SPHERE_CX = 250;
export const VEGAS_STATIC_SPHERE_R = 170;

/** Welcome sign — east of the static EDC rig. */
export const VEGAS_STATIC_SIGN_X = 1280;

/** Fallback fill behind landmarks — desert night sky. */
export const VEGAS_BACKDROP_FILL = '#0e0818';

/** Grass + sidewalk props sit this many px lower than default GND_Y. */
export const VEGAS_GRASS_DROP_Y = 30;

/** Porta-potties sit this many px below the default sidewalk Y. */
export const VEGAS_TOILET_DROP_Y = 40;

/** Neon palette — Strip signage at night. */
export const NEON = {
  pink: '#ff2e9a',
  cyan: '#00e5ff',
  gold: '#ffd23f',
  lime: '#7cff5a',
  violet: '#9b5cff',
  red: '#ff3b30',
  ice: '#bfeaff',
} as const;
