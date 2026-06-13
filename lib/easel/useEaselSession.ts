'use client';

import { useEffect, useState } from 'react';
import type { EaselSessionSync } from './types';
import { easelClockStart } from './sessionClock';

function hasEaselSlots(session: EaselSessionSync | null | undefined): session is EaselSessionSync {
  return Boolean(session?.slots?.length);
}

function mapSlotFromApi(s: Record<string, unknown>): EaselSessionSync['slots'][number] {
  return {
    slot: Number(s.slot),
    npc: String(s.npc),
    drawing_id: String(s.drawing_id),
    total_segments: Number(s.total_segments),
    segments_done: Number(s.segments_done),
    rate: Number(s.rate),
    status: s.status as EaselSessionSync['slots'][number]['status'],
    started_at: s.started_at != null ? String(s.started_at) : undefined,
  };
}

/** Local watched-clock session when PartyKit is offline or not yet running easels. */
export function fetchLocalEaselSession(stageSlug: string): Promise<EaselSessionSync | null> {
  return fetch(`/api/easel?stage=${encodeURIComponent(stageSlug)}`)
    .then(r => (r.ok ? r.json() : null))
    .then((data: { slots?: Record<string, unknown>[] } | null) => {
      if (!data?.slots?.length) return null;
      const slots = data.slots.map(mapSlotFromApi);
      const sessionStart = easelClockStart(slots[0]!, Date.now());
      return { sessionStart, slots };
    })
    .catch(() => null);
}

/**
 * Prefer PartyKit's watched session when it has slots; otherwise load from `/api/easel`.
 * Works with plain `npm run dev` — PartyKit is only needed for multi-user sync.
 */
export function useEaselSession(
  stageSlug: string,
  enabled: boolean,
  partySession: EaselSessionSync | null,
): EaselSessionSync | null {
  const [localSession, setLocalSession] = useState<EaselSessionSync | null>(null);

  useEffect(() => {
    if (!enabled) {
      setLocalSession(null);
      return;
    }
    if (hasEaselSlots(partySession)) return;

    let cancelled = false;
    void fetchLocalEaselSession(stageSlug).then(session => {
      if (!cancelled && session) setLocalSession(session);
    });
    return () => { cancelled = true; };
  }, [enabled, partySession, stageSlug]);

  if (hasEaselSlots(partySession)) return partySession;
  return localSession;
}
