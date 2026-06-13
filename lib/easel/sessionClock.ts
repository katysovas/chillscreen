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
