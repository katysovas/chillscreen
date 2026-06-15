'use client';

import { useEffect } from 'react';
import { easelMaxVisibleExpired, easelMaxVisibleRemainingMs } from './lifecycle';
import { notifyEaselUpdated } from './notifyUpdated';
import type { EaselSessionSync } from './types';

/**
 * Solo / local-dev fallback — refresh easel session when any canvas hits the 5-minute cap.
 * PartyKit's EaselScheduler owns this when a room session is active.
 */
export function useEaselMaxVisible(
  stageSlug: string,
  session: EaselSessionSync | null,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled || !session?.slots.length) return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const refresh = () => {
      if (cancelled) return;
      void fetch(`/api/easel?stage=${encodeURIComponent(stageSlug)}&sync=1`)
        .then(() => { if (!cancelled) notifyEaselUpdated(); })
        .catch(() => {});
    };

    for (const slot of session.slots) {
      if (slot.status !== 'painting' || !slot.started_at) continue;
      if (easelMaxVisibleExpired(slot.started_at)) {
        refresh();
      } else {
        timers.push(setTimeout(refresh, easelMaxVisibleRemainingMs(slot.started_at) + 50));
      }
    }

    return () => {
      cancelled = true;
      for (const timer of timers) clearTimeout(timer);
    };
  }, [stageSlug, session, enabled]);
}
