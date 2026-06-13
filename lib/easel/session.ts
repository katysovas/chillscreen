import type { EaselSessionSync } from './types';

/** NPC ids currently painting (not finished — those walk away). */
export function activePainterNpcIds(session: EaselSessionSync | null): Set<string> {
  if (!session) return new Set();
  return new Set(
    session.slots.filter(s => s.status === 'painting').map(s => s.npc),
  );
}
