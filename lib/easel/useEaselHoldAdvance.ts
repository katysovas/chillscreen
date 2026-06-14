'use client';

import { useEffect } from 'react';
import { advanceEaselIfReady } from './checkpointClient';
import { easelHoldRemainingMs } from './lifecycle';
import { notifyEaselUpdated } from './notifyUpdated';
import type { EaselSessionSync } from './types';

/**
 * Solo / local-dev fallback when PartyKit is not driving the hold → hide → next cycle.
 * PartyKit's EaselScheduler owns this when a room session is active.
 */
export function useEaselHoldAdvance(
  stageSlug: string,
  session: EaselSessionSync | null,
  enabled: boolean,
) {
  useEffect(() => {
    if (!enabled || !session?.slots.length) return;

    const doneSlot = session.slots.find(s => s.status === 'done');
    if (!doneSlot) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const runAdvance = () => {
      if (cancelled) return;
      void advanceEaselIfReady(stageSlug, doneSlot.slot).then(result => {
        if (result && !cancelled) notifyEaselUpdated();
      });
    };

    const remaining = easelHoldRemainingMs(doneSlot.completed_at);
    if (remaining <= 0) {
      runAdvance();
    } else {
      timer = setTimeout(runAdvance, remaining + 50);
    }

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [stageSlug, session, enabled]);
}
