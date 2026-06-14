import posthog from 'posthog-js';
import { POSTHOG_DEFAULTS, POSTHOG_HOST, POSTHOG_KEY } from '@/lib/posthogConfig';

function initPosthog() {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    defaults: POSTHOG_DEFAULTS,
    autocapture: false,
    capture_pageview: false,
    opt_in_site_apps: false,
  });
}

function schedulePosthogInit() {
  if (typeof window === 'undefined') return;
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(() => initPosthog(), { timeout: 8_000 });
    return;
  }
  globalThis.setTimeout(() => initPosthog(), 4_000);
}

schedulePosthogInit();
