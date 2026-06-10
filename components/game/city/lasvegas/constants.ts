export const VEGAS_GND = 660;

/** EDC "Electric Daze" rave megastage center x on Vegas tiles. */
export const EDC_STAGE_MID_X = 2270;

/** Display scale for the EDC rig + video (matches other venue ~2× boost). */
export const EDC_STAGE_SCALE = 2.1;

/** EDC-only vertical nudge — less than concert stages so the owl arch banner fits. */
export const EDC_STAGE_PUSH_Y = 16;

/** Rig width (deck + arch wings + crowd bleed) for in-view / focus checks. */
const EDC_STAGE_W = 760;

/** Half-width for in-view / focus checks. */
export const EDC_STAGE_HALF = Math.ceil((EDC_STAGE_W * EDC_STAGE_SCALE) / 2) + 24;

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
