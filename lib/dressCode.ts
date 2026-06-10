/** Venue dress code — Silent Disco requires headphones on every character. */

import type { VenueRoute } from '@/lib/venueSlugs';

let forcedHatId: string | null = null;
const listeners = new Set<() => void>();

/** Set the active venue — Silent Disco forces headphones on everyone. */
export function setVenueDressCode(route: VenueRoute | null): void {
  const next = route === 'silent-disco' ? 'hat-headphones' : null;
  if (next === forcedHatId) return;
  forcedHatId = next;
  listeners.forEach(l => l());
}

/** Hat item id every character must wear right now (null = no dress code). */
export function getForcedHatId(): string | null {
  return forcedHatId;
}

export function subscribeDressCode(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
