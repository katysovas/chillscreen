'use client';

import { getPlayerSession } from '@/lib/player/session';
import { parseVenueSlug, venueSlugForRoute, type VenueRoute } from '@/lib/venueRoutes';
import { updateFestie } from '@/lib/festie/client';

export function venueRouteForStageSlug(slug: string): VenueRoute | null {
  return parseVenueSlug(slug);
}

/** Save festie's home stage in DB (best-effort). */
export function persistFestieStage(route: VenueRoute): void {
  const session = getPlayerSession();
  if (!session.authenticated) return;
  const slug = venueSlugForRoute(route);
  if (session.festie?.stage_slug === slug) return;
  void updateFestie({ stage_slug: slug }).catch(() => {
    /* non-blocking */
  });
}
