'use client';

import { useMemo } from 'react';
import { useStageFestieCounts } from '@/lib/festie/useStageFestieCounts';
import { stageCrowdCountForRoute } from '@/lib/stageCrowdCount';
import { parseVenueSlug, VENUE_SLUGS } from '@/lib/venueSlugs';

/** Sum crowd totals across every stage (real festies + ambient NPCs). */
export function useLandingFestieTotal(): number {
  const realCounts = useStageFestieCounts();

  return useMemo(() => {
    return VENUE_SLUGS.reduce((sum, slug) => {
      const route = parseVenueSlug(slug);
      if (!route) return sum;
      return sum + stageCrowdCountForRoute(realCounts, route);
    }, 0);
  }, [realCounts]);
}
