import { ambientSeedForRoute, displaySeedForRoute } from '@/lib/ambientSeed';
import { npcCastForVenue } from '@/lib/npcCast';
import type { VenueRoute } from '@/lib/venueSlugs';
import { venueSlugForRoute } from '@/lib/venueSlugs';

/** Ambient NPCs spawned at this stage (generated sample + vendor, or legacy cast). */
export function ambientNpcCountForRoute(route: VenueRoute, seed?: number): number {
  const resolved = seed ?? ambientSeedForRoute(route);
  return npcCastForVenue(route, resolved).length;
}

/** Server-side estimate when session seed is unavailable. */
export function ambientNpcCountForRouteServer(route: VenueRoute): number {
  return npcCastForVenue(route, displaySeedForRoute(route)).length;
}

/** Real festies + ambient NPCs — matches visible crowd on stage. */
export function stageCrowdCountForRoute(
  realFestieCounts: Record<string, number>,
  route: VenueRoute,
  options?: { seed?: number; extraFesties?: number },
): number {
  const real = Math.max(0, realFestieCounts[venueSlugForRoute(route)] ?? 0);
  const extra = options?.extraFesties ?? 0;
  const npcs = ambientNpcCountForRoute(route, options?.seed);
  return real + extra + npcs;
}

/** Real festies + ambient NPCs for a creator stage slug. */
export function stageCrowdCountForCreatorSlug(
  realFestieCounts: Record<string, number>,
  slug: string,
  options?: { seed?: number },
): number {
  const real = Math.max(0, realFestieCounts[slug] ?? 0);
  const npcs = ambientNpcCountForRoute('creator-chill', options?.seed);
  return real + npcs;
}

export function formatStageCrowdCount(count: number): string {
  if (count === 1) return '1 festie';
  return `${count} festies`;
}
