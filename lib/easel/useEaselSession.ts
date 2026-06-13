'use client';

import { useEffect, useState } from 'react';
import type { EaselSessionSync, EaselSlotSync } from './types';
import { easelClockStart } from './sessionClock';

function hasEaselSlots(session: EaselSessionSync | null | undefined): session is EaselSessionSync {
  return Boolean(session?.slots?.length);
}

function mapSlotFromApi(s: Record<string, unknown>): EaselSlotSync {
  return {
    slot: Number(s.slot),
    npc: String(s.npc),
    drawing_id: String(s.drawing_id),
    total_segments: Number(s.total_segments),
    segments_done: Number(s.segments_done),
    rate: Number(s.rate),
    status: s.status as EaselSlotSync['status'],
    started_at: s.started_at != null ? String(s.started_at) : undefined,
    topic: s.topic != null ? String(s.topic) : undefined,
    program: s.program as EaselSlotSync['program'],
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

function mergeProgramData(party: EaselSessionSync, local: EaselSessionSync | null): EaselSessionSync {
  if (!local) return party;
  const slots = party.slots.map(slot => {
    const hit = local.slots.find(s => s.slot === slot.slot);
    if (!hit) return slot;
    return {
      ...slot,
      topic: slot.topic ?? hit.topic,
      program: slot.program ?? hit.program,
    };
  });
  return { sessionStart: party.sessionStart, slots };
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
    let cancelled = false;
    void fetchLocalEaselSession(stageSlug).then(session => {
      if (!cancelled && session) setLocalSession(session);
    });
    return () => { cancelled = true; };
  }, [enabled, stageSlug, partySession?.sessionStart]);

  useEffect(() => {
    if (!enabled) return;
    const refresh = () => {
      void fetchLocalEaselSession(stageSlug).then(session => {
        if (session) setLocalSession(session);
      });
    };
    window.addEventListener('easel-updated', refresh);
    return () => window.removeEventListener('easel-updated', refresh);
  }, [enabled, stageSlug]);

  if (hasEaselSlots(partySession)) {
    return mergeProgramData(partySession, localSession);
  }
  return localSession;
}
