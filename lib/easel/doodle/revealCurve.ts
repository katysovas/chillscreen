/** Front-loaded doodle reveal — fast early progress, eases into the finish. */

function easeOutCubic(t: number): number {
  const x = Math.max(0, Math.min(1, t));
  return 1 - (1 - x) ** 3;
}

/** Doodle easels reveal faster than stroke programs. */
export const EASEL_DOODLE_RATE = 2.5;

export const DOODLE_CHECKPOINT_MS = 45_000;
export const DOODLE_REVEAL_TICK_MS = 250;

/**
 * Map wall-clock to revealed cell count with a front-loaded curve.
 * Reaches ~70% around 40% of linear duration.
 */
export function liveDoodleSegmentsDone(
  segmentsDone: number,
  totalSegments: number,
  rate: number,
  clockStart: number,
  now = Date.now(),
): number {
  if (totalSegments <= 0) return 0;
  if (clockStart <= 0) return Math.min(totalSegments, segmentsDone);

  const elapsedSec = (now - clockStart) / 1000;
  const linearDuration = totalSegments / Math.max(0.1, rate);
  const t = Math.min(1, elapsedSec / linearDuration);
  const eased = easeOutCubic(t);
  const fromClock = Math.floor(eased * totalSegments);
  return Math.min(totalSegments, Math.max(segmentsDone, fromClock));
}
