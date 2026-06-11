/** Festie v1 knobs — single source of truth for decay, chat limits, and Life UI. */

export const FESTIE_CONFIG = {
  /** Chat-enabled window after owner leaves. */
  LIVE_WINDOW_MS: 24 * 60 * 60 * 1000,
  /** Visible-but-muted until this, then despawn. */
  DIM_WINDOW_MS: 72 * 60 * 60 * 1000,
  /** Min gap between LLM chats while owner offline (live tier). */
  OFFLINE_CHAT_INTERVAL_MS: 2 * 60 * 60 * 1000,
  /** Refresh / flaky-mobile grace before last_seen_at advances. */
  DISCONNECT_DEBOUNCE_MS: 60 * 1000,
  /** Max LLM chat sessions per offline live window. */
  MAX_CHATS_PER_OFFLINE_CYCLE: 12,
  /** Max turns per 1:1 player ↔ festie chat session. */
  MAX_TURNS_PER_CHAT: 10,
} as const;

export type FestieTier = 'live' | 'dim' | 'gone';

export function festieTier(lastSeenAt: Date, now = Date.now()): FestieTier {
  const age = now - lastSeenAt.getTime();
  if (age < FESTIE_CONFIG.LIVE_WINDOW_MS) return 'live';
  if (age < FESTIE_CONFIG.DIM_WINDOW_MS) return 'dim';
  return 'gone';
}

export function festieElapsedMs(lastSeenAt: Date | string, now = Date.now()): number {
  return Math.max(0, now - new Date(lastSeenAt).getTime());
}

/** Heart fill 0–1 while owner offline (drains over LIVE_WINDOW_MS). */
export function festieLifeFill(
  lastSeenAt: Date | string,
  ownerOnline: boolean,
  now = Date.now(),
): number {
  if (ownerOnline) return 1;
  const elapsed = festieElapsedMs(lastSeenAt, now);
  return Math.max(0, Math.min(1, 1 - elapsed / FESTIE_CONFIG.LIVE_WINDOW_MS));
}

/** Human-readable duration for Life modal copy (e.g. "24h", "48h"). */
export function formatFestieDurationMs(ms: number): string {
  const hours = Math.round(ms / (60 * 60 * 1000));
  return `${hours}h`;
}

export const FESTIE_LIVE_DURATION_LABEL = formatFestieDurationMs(FESTIE_CONFIG.LIVE_WINDOW_MS);
export const FESTIE_DIM_DURATION_LABEL = formatFestieDurationMs(
  FESTIE_CONFIG.DIM_WINDOW_MS - FESTIE_CONFIG.LIVE_WINDOW_MS,
);
