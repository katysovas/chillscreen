import { minStageScale } from '@/lib/stageViewport';
import { STAGE_TOILET } from '@/lib/stageToilets';

/** Welcome arch center x on Tentaroo tiles (tentaroo-arch.svg). */
export const TENTAROO_ARCH_MID_X = 1460;

/** Display scale for tentaroo-arch.svg (feet stay on {@link TENTAROO_GND}). */
export const TENTAROO_ARCH_SCALE = 0.85;

/** Native arch artboard — feet sit on {@link TENTAROO_GND}. */
export const TENTAROO_ARCH_ART_W = 1400;
export const TENTAROO_ARCH_ART_H = 820;
export const TENTAROO_ARCH_ART_MID_X = 700;
export const TENTAROO_ARCH_ART_GROUND_Y = 742;

/** Ground line on Tentaroo tiles. */
export const TENTAROO_GND = 660;

export const TENTAROO_MID_TILE_W = 2600;
export const TENTAROO_MID_TILE_H = 900;

/** Which Stage — bioluminescent main stage, east of the arch. */
export const WHICH_STAGE_MID_X = 1620;

/** Mid-layer slice when the camera is fixed on the stage (matches lib/venues VIEW_*). */
export const TENTAROO_STATIC_VIEWPORT_X = WHICH_STAGE_MID_X - 700;
export const TENTAROO_STATIC_VIEWPORT_W = 1400;

/** Fallback fill behind the scene photo — matches tent-city sky tone. */
export const TENTAROO_BACKDROP_FILL = '#b8dce8';

/** Grass + sidewalk props sit this many px lower than default GND_Y. */
export const TENTAROO_GRASS_DROP_Y = 30;

/** Porta-potties sit this many px below the default sidewalk Y. */
export const TENTAROO_TOILET_DROP_Y = 40;

export const WHICH_STAGE_SCALE = minStageScale(1.95);

export const WHICH_STAGE_PUSH_Y = 88;

/** Static viewport — smaller rig so the truss + LED wall fit in frame. */
export const STATIC_WHICH_STAGE_SCALE = minStageScale(1.62);

export const STATIC_WHICH_STAGE_PUSH_Y = 64;

const WHICH_STAGE_W = 500;

/** Half-width for in-view / focus checks (scaled rig + crowd bleed). */
export const WHICH_STAGE_HALF = Math.ceil((WHICH_STAGE_W * WHICH_STAGE_SCALE) / 2) + 28;

/** Scaled deck half-width — lines up porta-potties with the visible stage edge. */
export const WHICH_STAGE_TOILET_HALF =
  Math.ceil((480 * STATIC_WHICH_STAGE_SCALE) / 2) + STAGE_TOILET.stageHalfBleed;

/** Bioluminescent palette — glass-world main stage. */
export const WHICH_NEON = {
  green: '#38f5b0',
  cyan: '#2fe6ff',
  magenta: '#ff4fd8',
  amber: '#ffc14d',
  violet: '#9b6bff',
  edge: 'rgba(56,245,176,.55)',
} as const;
