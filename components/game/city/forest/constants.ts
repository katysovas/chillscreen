/** Ground line on Forest tiles. */
export const FOREST_GND = 660;

/** The Forest Stage — glowing woods main stage, center of the tile. */
export const FOREST_STAGE_MID_X = 1500;

import { minStageScale } from '@/lib/stageViewport';

export const FOREST_STAGE_SCALE = minStageScale(1.95);

export const FOREST_STAGE_PUSH_Y = 88;

const FOREST_STAGE_W = 500;

/** Half-width for in-view / focus checks (scaled rig + crowd bleed). */
export const FOREST_STAGE_HALF = Math.ceil((FOREST_STAGE_W * FOREST_STAGE_SCALE) / 2) + 28;

/** Scaled deck half-width — lines up porta-potties with the visible stage edge. */
export const FOREST_STAGE_TOILET_HALF = Math.ceil((480 * FOREST_STAGE_SCALE) / 2) + 12;

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
