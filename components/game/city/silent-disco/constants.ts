import { minStageScale } from '@/lib/stageViewport';
import { STAGE_TOILET } from '@/lib/stageToilets';

/** Ground line on Silent Disco tiles. */
export const SILENT_DISCO_GND = 660;

/** Silent Disco — headphone rave main stage, center of the tile. */
export const SILENT_DISCO_STAGE_MID_X = 1300;

export const SILENT_DISCO_MID_TILE_W = 2600;
export const SILENT_DISCO_MID_TILE_H = 900;

/** Mid-layer slice when the camera is fixed on the stage (matches lib/venues VIEW_*). */
export const SILENT_DISCO_STATIC_VIEWPORT_X = SILENT_DISCO_STAGE_MID_X - 700;
export const SILENT_DISCO_STATIC_VIEWPORT_W = 1400;

/** Scaled glitch sign — centered above the static stage rig. */
export const STATIC_SILENT_DISCO_MARQUEE_X = SILENT_DISCO_STAGE_MID_X;
export const STATIC_SILENT_DISCO_MARQUEE_FONT = 34;

/**
 * Shift the scene image left so the baked-in sign (x≈340–840) falls outside
 * the static viewport clip (left edge ≈ viewport x).
 */
export const STATIC_SILENT_DISCO_SCENE_SHIFT_X = -300;

/** Fallback fill behind the scene photo — matches dark sky edge tone. */
export const SILENT_DISCO_BACKDROP_FILL = '#03060e';

/** Grass + sidewalk props sit this many px lower than default GND_Y. */
export const SILENT_DISCO_GRASS_DROP_Y = 30;

/** Porta-potties sit this many px below the default sidewalk Y. */
export const SILENT_DISCO_TOILET_DROP_Y = 40;

export const SILENT_DISCO_STAGE_SCALE = minStageScale(1.95);

export const SILENT_DISCO_STAGE_PUSH_Y = 88;

/** Static viewport — smaller rig so disco ball + marquee fit in frame. */
export const STATIC_SILENT_DISCO_STAGE_SCALE = minStageScale(1.62);

export const STATIC_SILENT_DISCO_STAGE_PUSH_Y = 64;

/** trussY − hanging line (matches SilentDiscoStage.tsx). */
const STATIC_STAGE_TRUSS_TOP = 276;

/** Top of the first line — sits just above the scaled truss / disco ball. */
export const STATIC_SILENT_DISCO_MARQUEE_Y = (() => {
  const stageTop = STATIC_SILENT_DISCO_STAGE_PUSH_Y + SILENT_DISCO_GND
    + STATIC_SILENT_DISCO_STAGE_SCALE * (STATIC_STAGE_TRUSS_TOP - SILENT_DISCO_GND);
  const signH = STATIC_SILENT_DISCO_MARQUEE_FONT
    + Math.round(STATIC_SILENT_DISCO_MARQUEE_FONT * 0.92);
  return Math.round(stageTop - signH - 14);
})();

const SILENT_DISCO_STAGE_W = 500;

/** Half-width for in-view / focus checks (scaled rig + crowd bleed). */
export const SILENT_DISCO_STAGE_HALF = Math.ceil((SILENT_DISCO_STAGE_W * SILENT_DISCO_STAGE_SCALE) / 2) + 28;

/** Scaled deck half-width — lines up porta-potties with the visible stage edge. */
export const SILENT_DISCO_STAGE_TOILET_HALF =
  Math.ceil((480 * SILENT_DISCO_STAGE_SCALE) / 2) + STAGE_TOILET.stageHalfBleed;

/** Rave palette — headphone party under a dark sky. */
export const SD_NEON = {
  laser: '#3dffb0',
  cyan: '#36e3ff',
  magenta: '#ff3df0',
  blue: '#3d9bff',
  amber: '#ff9d3d',
  violet: '#9d5cff',
  edge: 'rgba(54,227,255,.55)',
} as const;
