/** CSS bottom offset — feet align with the ground-layer sidewalk (GND ≈ 76% in viewBox). */
export const CHAR_BOTTOM = '11%';

/** Mobile lounge override — applied via `.game-character` in globals.css. */
export const CHAR_BOTTOM_MOBILE_LOUNGE = '20%';

/** Stagger NPC / remote Y on mobile so sprites don't stack (px). */
export const MOBILE_CROWD_DEPTH_PX = 10;

export function mobileCrowdDepthIndex(seed: number | string): 0 | 1 | 2 {
  if (typeof seed === 'number') return (Math.abs(seed) % 3) as 0 | 1 | 2;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h + seed.charCodeAt(i)) % 3;
  return h as 0 | 1 | 2;
}
