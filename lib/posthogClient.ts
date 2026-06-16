import { POSTHOG_DEFAULTS, POSTHOG_HOST, POSTHOG_KEY } from '@/lib/posthogConfig';

type PostHogClient = typeof import('posthog-js').default;

let initPromise: Promise<PostHogClient | null> | null = null;

/** Skip admin routes — game + marketing pages only. */
export function shouldEnablePosthog(pathname = ''): boolean {
  if (typeof window === 'undefined') return false;
  const path = pathname || window.location.pathname;
  return !path.startsWith('/admin');
}

let posthogInitialized = false;

/** Lazy-load posthog-js — keeps it out of the main client graph until first use. */
export function getPosthog(): Promise<PostHogClient | null> {
  if (typeof window === 'undefined') return Promise.resolve(null);
  if (!shouldEnablePosthog()) return Promise.resolve(null);
  if (!POSTHOG_KEY) return Promise.resolve(null);

  if (!initPromise) {
    initPromise = import('posthog-js').then(({ default: posthog }) => {
      if (!posthogInitialized) {
        posthog.init(POSTHOG_KEY, {
          api_host: POSTHOG_HOST,
          defaults: POSTHOG_DEFAULTS,
          autocapture: false,
          capture_pageview: false,
          opt_in_site_apps: false,
        });
        posthogInitialized = true;
      }
      return posthog;
    }).catch(err => {
      console.error('[posthog] init failed', err);
      initPromise = null;
      return null;
    });
  }
  return initPromise;
}

export function schedulePosthogInit(): void {
  if (typeof window === 'undefined' || !shouldEnablePosthog()) return;
  const run = () => { void getPosthog(); };
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(run, { timeout: 8_000 });
    return;
  }
  globalThis.setTimeout(run, 4_000);
}
