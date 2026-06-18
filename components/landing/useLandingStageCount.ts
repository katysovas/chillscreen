'use client';

import { useEffect, useState } from 'react';
import { displayStageCount } from '@/lib/landing/displayStats';
import { VENUE_SLUGS } from '@/lib/venueSlugs';

/** Built-in venues + active creator stages — inflated for LP. */
export function useLandingStageCount(initialCreatorStages = 0): number {
  const [creatorStages, setCreatorStages] = useState(initialCreatorStages);

  useEffect(() => {
    let cancelled = false;
    void fetch('/api/stages/stats')
      .then(res => (res.ok ? res.json() : { creatorStages: 0 }))
      .then(data => {
        if (!cancelled) setCreatorStages(Number(data.creatorStages) || 0);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return displayStageCount(VENUE_SLUGS.length, creatorStages);
}
