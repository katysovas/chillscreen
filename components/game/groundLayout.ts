/** CSS bottom offset — feet align with the ground-layer sidewalk (GND ≈ 76% in viewBox). */
export const CHAR_BOTTOM = '11%';

/** Pair-chat column sits above NPC heads (feet at CHAR_BOTTOM, scale ≈ 0.34). */
export const NPC_PAIR_CHAT_LIFT_PX = 98;

/** Mobile lounge override — applied via `.game-character` in globals.css. */
export const CHAR_BOTTOM_MOBILE_LOUNGE = '20%';

function hashSeed(seed: number | string): number {
  if (typeof seed === 'number') return Math.abs(seed);
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Stable sidewalk depth offset (px) from a character id or index.
 * Three depth rows at 0 / 50 / 100px (positive = lower on screen).
 */
export function crowdDepthOffsetPx(seed: number | string): number {
  const h = hashSeed(seed);
  const tier = h % 3;
  return tier * 50;
}

/** Crowd z-index range — lower on screen (larger depthY) renders on top. */
export const CROWD_Z_MIN = 18;
export const CROWD_Z_MAX = 20;

/** z-index for crowd characters — lower on screen (larger depthY) stacks above. */
export function crowdDepthZIndex(depthY: number): number {
  return CROWD_Z_MIN + Math.min(2, Math.round(depthY / 50));
}
