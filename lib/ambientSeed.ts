import type { VenueRoute } from '@/lib/venueSlugs';
import { venueSlugForRoute } from '@/lib/venueSlugs';

const SESSION_PREFIX = 'whichstage-ambient-seed:';

/** Stable fallback seed when session storage is unavailable (SSR / picker estimate). */
export function displaySeedForRoute(route: VenueRoute): number {
  const slug = venueSlugForRoute(route);
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h = Math.imul(h ^ slug.charCodeAt(i), 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/**
 * Per-stage visit seed — random once per tab session so crowd + picker counts
 * stay aligned for that visit.
 */
export function ambientSeedForRoute(route: VenueRoute): number {
  if (typeof window === 'undefined') return displaySeedForRoute(route);

  const key = `${SESSION_PREFIX}${route}`;
  try {
    const stored = sessionStorage.getItem(key);
    if (stored != null) {
      const n = Number(stored);
      if (Number.isFinite(n)) return n >>> 0;
    }
    const seed = (Math.random() * 0x1_0000_0000) >>> 0;
    sessionStorage.setItem(key, String(seed));
    return seed;
  } catch {
    return displaySeedForRoute(route);
  }
}
