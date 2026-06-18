'use client';

import { useEffect, useMemo, useState } from 'react';
import { fetchUserStage } from '@/lib/stages/client';
import type { UserStagePublic } from '@/lib/stages/types';
import type { FeaturedChartEntry } from '@/lib/stages/featuredStagesChart';
import { creatorStageForChartEntry } from '@/lib/stages/chartEntryDisplay';

/** Live metadata for creator stages referenced in the featured chart. */
export function useCreatorChartMeta(entries: FeaturedChartEntry[]): Map<string, UserStagePublic> {
  const slugs = useMemo(
    () => [...new Set(entries.map(creatorStageForChartEntry).filter(Boolean) as string[])],
    [entries],
  );
  const slugKey = slugs.join('\0');
  const [meta, setMeta] = useState<Map<string, UserStagePublic>>(new Map());

  useEffect(() => {
    if (slugs.length === 0) {
      setMeta(new Map());
      return;
    }
    let cancelled = false;
    void Promise.all(
      slugs.map(async slug => {
        try {
          return [slug, await fetchUserStage(slug)] as const;
        } catch {
          return [slug, null] as const;
        }
      }),
    ).then(results => {
      if (cancelled) return;
      const next = new Map<string, UserStagePublic>();
      for (const [slug, stage] of results) {
        if (stage) next.set(slug, stage);
      }
      setMeta(next);
    });
    return () => { cancelled = true; };
  }, [slugKey, slugs]);

  return meta;
}
