'use client';

import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { trackPageView } from '@/lib/analytics';

/** Fires PostHog `$pageview` on route changes (including the landing page). */
export function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!pathname) return;
    const query = searchParams.toString();
    trackPageView(pathname, query ? `?${query}` : '');
  }, [pathname, searchParams]);

  return null;
}
