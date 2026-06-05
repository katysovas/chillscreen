'use client';

import { useState, useEffect } from 'react';
import { getSkyPeriod, type SkyPeriod } from '@/lib/skyTimeOfDay';

/** Browser-local time of day; refreshes every minute. */
export function useSkyPeriod(): SkyPeriod {
  const [period, setPeriod] = useState<SkyPeriod>('day');
  useEffect(() => {
    const update = () => setPeriod(getSkyPeriod());
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);
  return period;
}
