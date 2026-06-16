'use client';

import { useEffect, useState } from 'react';
import {
  formatStageCrowdCount,
  stageCrowdCountForRoute,
} from '@/lib/stageCrowdCount';
import type { VenueRoute } from '@/lib/venueSlugs';

/** Poll interval — crowd counts are cached server-side (~60s); no need to hammer the API. */
const REFRESH_MS = 180_000;

export { formatStageCrowdCount as formatFestieCount };

/** Real festies + ambient NPCs for one stage (uses session seed when in browser). */
export function festieCountForRoute(
  realFestieCounts: Record<string, number>,
  route: VenueRoute,
  extraFesties = 0,
): number {
  return stageCrowdCountForRoute(realFestieCounts, route, { extraFesties });
}

/** Poll real festie counts; combine with local NPC cast for display totals. */
export function useStageFestieCounts(): Record<string, number> {
  const [realCounts, setRealCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;

    const load = () => {
      fetch('/api/festies/counts')
        .then(res => (res.ok ? res.json() : { festies: {} }))
        .then(data => {
          if (!cancelled) setRealCounts(data.festies ?? {});
        })
        .catch(() => {
          if (!cancelled) setRealCounts({});
        });
    };

    load();
    const id = window.setInterval(load, REFRESH_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, []);

  return realCounts;
}
