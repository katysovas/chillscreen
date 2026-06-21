'use client';

import { useEffect, useMemo, useState } from 'react';
import type { StageVideoDisplayMeta } from '@/lib/stageVideoMeta';

const cache = new Map<string, StageVideoDisplayMeta>();
const inflight = new Map<string, Promise<void>>();

function idsNeedingFetch(ids: string[]): string[] {
  return ids.filter(id => !cache.has(id));
}

async function fetchVideoMeta(ids: string[]): Promise<void> {
  const missing = idsNeedingFetch(ids);
  if (!missing.length) return;

  const key = missing.sort().join(',');
  const existing = inflight.get(key);
  if (existing) {
    await existing;
    return;
  }

  const promise = (async () => {
    const res = await fetch(`/api/stage/video-meta?ids=${encodeURIComponent(missing.join(','))}`);
    if (!res.ok) return;
    const data = await res.json() as { videos?: Record<string, StageVideoDisplayMeta> };
    for (const [id, meta] of Object.entries(data.videos ?? {})) {
      cache.set(id, meta);
    }
  })().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, promise);
  await promise;
}

export function useStageVideoMeta(videoIds: string[]): Map<string, StageVideoDisplayMeta> {
  const stableIds = useMemo(
    () => [...new Set(videoIds.filter(Boolean))].sort().join(','),
    [videoIds],
  );
  const ids = useMemo(() => (stableIds ? stableIds.split(',') : []), [stableIds]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!ids.length) return;
    let cancelled = false;

    void fetchVideoMeta(ids).then(() => {
      if (!cancelled) setTick(n => n + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [ids]);

  return useMemo(() => {
    void tick;
    const out = new Map<string, StageVideoDisplayMeta>();
    for (const id of ids) {
      const meta = cache.get(id);
      if (meta) out.set(id, meta);
    }
    return out;
  }, [ids, tick]);
}
