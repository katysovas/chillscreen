import { parseStartedAtMs } from './sessionClock';
import { EASEL_HOLD_MS, EASEL_MAX_VISIBLE_MS } from './types';

export function parseCompletedAtMs(completedAt: string | null | undefined): number | null {
  if (!completedAt) return null;
  const ms = Date.parse(completedAt);
  return Number.isFinite(ms) ? ms : null;
}

export function easelHoldRemainingMs(
  completedAt: string | null | undefined,
  now = Date.now(),
): number {
  const doneMs = parseCompletedAtMs(completedAt);
  if (doneMs == null) return EASEL_HOLD_MS;
  return Math.max(0, EASEL_HOLD_MS - (now - doneMs));
}

export function easelHoldExpired(
  completedAt: string | null | undefined,
  now = Date.now(),
): boolean {
  return easelHoldRemainingMs(completedAt, now) <= 0;
}

export function easelMaxVisibleRemainingMs(
  startedAt: string | null | undefined,
  now = Date.now(),
): number {
  const startMs = parseStartedAtMs(startedAt ?? undefined);
  if (startMs == null) return EASEL_MAX_VISIBLE_MS;
  return Math.max(0, EASEL_MAX_VISIBLE_MS - (now - startMs));
}

export function easelMaxVisibleExpired(
  startedAt: string | null | undefined,
  now = Date.now(),
): boolean {
  return easelMaxVisibleRemainingMs(startedAt, now) <= 0;
}

export function chatDrawingExpiresAt(sessionStart: number): number {
  return sessionStart + EASEL_MAX_VISIBLE_MS;
}
