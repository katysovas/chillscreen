'use client';

import { useEffect, useState } from 'react';
import type { VenueRoute } from '@/lib/venueRoutes';
import { getCachedStageMidBundle, loadStageMidBundle } from './registry';
import type { StageMidBundle } from './types';

/** Load the code-split mid tile bundle for the current isolated city route. */
export function useStageMidBundle(route: VenueRoute | undefined): StageMidBundle | null {
  const [bundle, setBundle] = useState<StageMidBundle | null>(() =>
    route ? getCachedStageMidBundle(route)?.bundle ?? null : null,
  );

  useEffect(() => {
    if (!route) {
      setBundle(null);
      return;
    }
    const cached = getCachedStageMidBundle(route);
    if (cached) {
      setBundle(cached.bundle);
      return;
    }
    let cancelled = false;
    loadStageMidBundle(route).then(mod => {
      if (!cancelled) setBundle(mod.bundle);
    });
    return () => {
      cancelled = true;
    };
  }, [route]);

  return bundle;
}
