'use client';

import { getPlayerSession } from '@/lib/player/session';
import { parseVenueSlug, venueSlugForRoute, type VenueRoute } from '@/lib/venueRoutes';
import { updateFestie } from '@/lib/festie/client';

export function venueRouteForStageSlug(slug: string): VenueRoute | null {
  return parseVenueSlug(slug);
}

/** Save festie's home stage slug in DB (best-effort). */
export function persistFestieStageSlug(slug: string): void {
  const session = getPlayerSession();
  if (!session.authenticated) return;
  const normalized = slug.trim().toLowerCase();
  if (!normalized || session.festie?.stage_slug === normalized) return;
  void updateFestie({ stage_slug: normalized }).catch(() => {
    /* non-blocking */
  });
}

/** Save festie's home stage from a built-in venue route. */
export function persistFestieStage(route: VenueRoute): void {
  persistFestieStageSlug(venueSlugForRoute(route));
}
