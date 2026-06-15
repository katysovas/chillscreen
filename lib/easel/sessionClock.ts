import type { EaselSlotSync } from './types';

export function parseStartedAtMs(startedAt: string | undefined): number | null {
  if (!startedAt) return null;
  const ms = Date.parse(startedAt);
  return Number.isFinite(ms) ? ms : null;
}

/** Watched-clock anchor — DB started_at when progress exists, else fresh session. */
export function easelClockStart(slot: EaselSlotSync, sessionStart: number): number {
  if (slot.segments_done <= 0 || slot.status === 'done') return sessionStart;
  return parseStartedAtMs(slot.started_at) ?? sessionStart;
}

/**
 * Client paint clock — sessionStart may be 0 until the NPC reaches the easel.
 * Once the painter is ready, start (or keep) a local clock so strokes animate.
 */
export function resolveEaselClockStart(
  painterReady: boolean,
  sessionStart: number,
  previousClockStart: number,
  now = Date.now(),
): number {
  if (!painterReady) return 0;
  if (sessionStart > 0) return sessionStart;
  if (previousClockStart > 0) return previousClockStart;
  return now;
}
