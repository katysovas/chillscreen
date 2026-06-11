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
 * Spreads the crowd vertically so balloons/sprites don't fully stack.
 */
export function crowdDepthOffsetPx(seed: number | string): number {
  const h = hashSeed(seed);
  const sign = h % 2 === 0 ? 1 : -1;
  const magnitude = 5 + (h % 6); // 5–10px
  return sign * magnitude;
}
