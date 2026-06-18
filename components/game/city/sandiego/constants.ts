import { minStageScale } from '@/lib/stageViewport';
import { STAGE_TOILET } from '@/lib/stageToilets';

export const SD_GND = 660;
export const COACHELLA_MID_TILE_H = 900;

/** Main-stage LED wall center x on Coachella tiles (scrolling city). */
export const COACHELLA_STAGE_MID_X = 2125;

/**
 * Fixed-camera The Desert — stage centered in the static viewport slice.
 */
export const COACHELLA_STATIC_STAGE_MID_X = 700;
export const COACHELLA_STATIC_VIEWPORT_X = COACHELLA_STATIC_STAGE_MID_X - 700;
export const COACHELLA_STATIC_VIEWPORT_W = 1400;

/** Fallback fill behind desert ridges — warm sky tone. */
export const COACHELLA_BACKDROP_FILL = '#c9bcc6';

/** Scale factor applied to the Coachella main stage (matches cinema/concert display boost). */
export const COACHELLA_STAGE_SCALE = minStageScale(2.4);

/** Smaller rig on the static /thedesert page so mountains + decor fit in frame. */
export const COACHELLA_STATIC_STAGE_SCALE = minStageScale(1.72);

/** Coachella-only vertical nudge — less than concert/EDC (scaled rig is already tall). */
export const COACHELLA_STAGE_PUSH_Y = 103;

/** Static viewport — slightly less push so the truss fits above the crowd lane. */
export const COACHELLA_STATIC_STAGE_PUSH_Y = 76;

/** Porta-potties sit this many px below the default sidewalk Y. */
export const COACHELLA_TOILET_DROP_Y = 40;

/** Truss portal extents (pre-scale). */
export const COACHELLA_STAGE_L = 2010;
export const COACHELLA_STAGE_R = 2440;

const COACHELLA_STAGE_W = COACHELLA_STAGE_R - COACHELLA_STAGE_L + 150;

/** Half-width for in-view / focus checks (scaled stage + crowd bleed). */
export const COACHELLA_STAGE_HALF = Math.ceil((COACHELLA_STAGE_W * COACHELLA_STAGE_SCALE) / 2) + 24;

/** Half-width on the static /thedesert page (smaller scale). */
export const COACHELLA_STATIC_STAGE_HALF =
  Math.ceil((COACHELLA_STAGE_W * COACHELLA_STATIC_STAGE_SCALE) / 2) + 24;

/** Scaled deck half-width — lines up porta-potties with the visible stage edge. */
export const COACHELLA_STATIC_TOILET_HALF =
  Math.ceil((COACHELLA_STAGE_W * COACHELLA_STATIC_STAGE_SCALE) / 2) + STAGE_TOILET.stageHalfBleed;

/** Visual half-widths after the off-center 2.2× scale (roof overhang included) —
 *  used to place props (toilets) flush against the rendered stage edges. */
export const COACHELLA_TOILET_LEFT_HALF =
  Math.ceil(COACHELLA_STAGE_SCALE * (COACHELLA_STAGE_MID_X - (COACHELLA_STAGE_L - 26)));
export const COACHELLA_TOILET_RIGHT_HALF =
  Math.ceil(COACHELLA_STAGE_SCALE * ((COACHELLA_STAGE_R + 26) - COACHELLA_STAGE_MID_X));

export const FEST_COLORS = ['#e85074', '#f0b840', '#46c8d8', '#7a5ad0', '#5ac86e', '#f07840'] as const;

export const SD_WATER = '#6fa8c8';

/** Desert ridge palette — shared with town→SD transition edges. */
export const DESERT_FAR = '#c9bcc6';
export const DESERT_MID = '#b69aa0';
export const DESERT_NEAR = '#a8867c';
