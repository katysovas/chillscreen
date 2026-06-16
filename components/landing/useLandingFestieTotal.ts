'use client';

import { useMemo } from 'react';
import { displayFestieCount } from '@/lib/landing/displayStats';
import { useStageFestieCounts } from '@/lib/festie/useStageFestieCounts';
import { stageCrowdCountForCreatorSlug, stageCrowdCountForRoute } from '@/lib/stageCrowdCount';
import { parseVenueSlug, VENUE_SLUGS } from '@/lib/venueSlugs';

const VENUE_SLUG_SET = new Set<string>(VENUE_SLUGS);

/** Crowd totals across every stage (venues + creator slugs) — inflated for LP. */
export function useLandingFestieTotal(): number {
  const realCounts = useStageFestieCounts();

  return useMemo(() => {
    let total = 0;
    for (const slug of VENUE_SLUGS) {
      const route = parseVenueSlug(slug);
      if (!route) continue;
      total += stageCrowdCountForRoute(realCounts, route);
    }
    for (const [slug, count] of Object.entries(realCounts)) {
      if (!VENUE_SLUG_SET.has(slug)) {
        total += stageCrowdCountForCreatorSlug(realCounts, slug);
      }
    }
    return displayFestieCount(total);
  }, [realCounts]);
}
