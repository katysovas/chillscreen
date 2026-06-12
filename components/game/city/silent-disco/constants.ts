/** Ground line on Silent Disco tiles. */
export const SILENT_DISCO_GND = 660;

/** Silent Disco — headphone rave main stage, center of the tile. */
export const SILENT_DISCO_STAGE_MID_X = 1300;

import { minStageScale } from '@/lib/stageViewport';

export const SILENT_DISCO_STAGE_SCALE = minStageScale(1.95);

export const SILENT_DISCO_STAGE_PUSH_Y = 88;

const SILENT_DISCO_STAGE_W = 500;

/** Half-width for in-view / focus checks (scaled rig + crowd bleed). */
export const SILENT_DISCO_STAGE_HALF = Math.ceil((SILENT_DISCO_STAGE_W * SILENT_DISCO_STAGE_SCALE) / 2) + 28;

/** Scaled deck half-width — lines up porta-potties with the visible stage edge. */
export const SILENT_DISCO_STAGE_TOILET_HALF = Math.ceil((480 * SILENT_DISCO_STAGE_SCALE) / 2) + 12;

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
