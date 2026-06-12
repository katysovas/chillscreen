/** YouTube embed minimum rendered viewport (200×200). */
export const STAGE_MIN_VIEWPORT_PX = 200;

/** LED wall design height before tile scale. */
export const STAGE_LED_BASE_H = 192;

/** Ensure scaled stage video never renders below YouTube's 200px floor. */
export function minStageScale(scale: number, baseH = STAGE_LED_BASE_H): number {
  return Math.max(scale, STAGE_MIN_VIEWPORT_PX / baseH);
}
