/** Welcome arch center x on Tentaroo tiles (tentaroo-arch.svg). */
export const TENTAROO_ARCH_MID_X = 1160;

/** Display scale for tentaroo-arch.svg (feet stay on {@link TENTAROO_GND}). */
export const TENTAROO_ARCH_SCALE = 0.85;

/** Native arch artboard — feet sit on {@link TENTAROO_GND}. */
export const TENTAROO_ARCH_ART_W = 1400;
export const TENTAROO_ARCH_ART_H = 820;
export const TENTAROO_ARCH_ART_MID_X = 700;
export const TENTAROO_ARCH_ART_GROUND_Y = 742;

/** Ground line on Tentaroo tiles. */
export const TENTAROO_GND = 660;

/** Which Stage — bioluminescent main stage, east of the arch. */
export const WHICH_STAGE_MID_X = 1620;

export const WHICH_STAGE_SCALE = 1.75;

export const WHICH_STAGE_PUSH_Y = 88;

const WHICH_STAGE_W = 500;

/** Half-width for in-view / focus checks (scaled rig + crowd bleed). */
export const WHICH_STAGE_HALF = Math.ceil((WHICH_STAGE_W * WHICH_STAGE_SCALE) / 2) + 28;

/** Scaled deck half-width — lines up porta-potties with the visible stage edge. */
export const WHICH_STAGE_TOILET_HALF = Math.ceil((480 * WHICH_STAGE_SCALE) / 2) + 12;

/** Bioluminescent palette — glass-world main stage. */
export const WHICH_NEON = {
  green: '#38f5b0',
  cyan: '#2fe6ff',
  magenta: '#ff4fd8',
  amber: '#ffc14d',
  violet: '#9b6bff',
  edge: 'rgba(56,245,176,.55)',
} as const;
