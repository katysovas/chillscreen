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

    const doneSlots = session.slots.filter(s => s.status === 'done');
    if (doneSlots.length === 0) return;

    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const runAdvance = (slot: number) => {
      if (cancelled) return;
      void advanceEaselIfReady(stageSlug, slot).then(result => {
        if (result && !cancelled) notifyEaselUpdated();
      });
    };

    for (const doneSlot of doneSlots) {
      const remaining = easelHoldRemainingMs(doneSlot.completed_at);
      if (remaining <= 0) {
        runAdvance(doneSlot.slot);
      } else {
        timers.push(setTimeout(() => runAdvance(doneSlot.slot), remaining + 50));
      }
    }

    return () => {
      cancelled = true;
      for (const timer of timers) clearTimeout(timer);
    };
  }, [stageSlug, session, enabled]);
}
