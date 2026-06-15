import { easelHoldExpired } from './lifecycle';
import type { EaselSessionSync, EaselStatus } from './types';

type EaselSlotLike = {
  slot: number;
  status: EaselStatus;
  started_at?: string;
  completed_at?: string | null;
};

function parseTimeMs(value: string | null | undefined): number {
  if (!value) return 0;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : 0;
}

function isHeldDoneSlot(slot: EaselSlotLike): boolean {
  return slot.status === 'done' && !easelHoldExpired(slot.completed_at);
}

/**
 * Ambient (unprompted) stage easels — one active painter per room.
 * Finished canvases stay visible until the post-completion hold expires.
 */
export function pickAmbientEaselSlots<T extends EaselSlotLike>(slots: T[]): T[] {
  const painting = slots.filter(s => s.status === 'painting');
  if (painting.length > 0) {
    const pick = painting.length === 1
      ? painting[0]!
      : painting.reduce((best, cur) =>
          parseTimeMs(cur.started_at) >= parseTimeMs(best.started_at) ? cur : best,
        );
    return [pick];
  }

  return slots.filter(isHeldDoneSlot);
}

/** @deprecated Alias for pickAmbientEaselSlots — stage easel session visibility. */
export function pickVisibleEaselSlots<T extends EaselSlotLike>(slots: T[]): T[] {
  return pickAmbientEaselSlots(slots);
}

export function pickVisibleEaselSlot<T extends EaselSlotLike>(slots: T[]): T | null {
  return pickVisibleEaselSlots(slots)[0] ?? null;
}

export function narrowEaselSession(session: EaselSessionSync | null): EaselSessionSync | null {
  if (!session?.slots.length) return session;
  const slots = pickVisibleEaselSlots(session.slots);
  if (slots.length === session.slots.length) return session;
  return { ...session, slots };
}
