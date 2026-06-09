import posthog from 'posthog-js';
import { installGameInputAnalytics } from '@/lib/gameInputAnalytics';
import { POSTHOG_DEFAULTS, POSTHOG_HOST, POSTHOG_KEY } from '@/lib/posthogConfig';

posthog.init(POSTHOG_KEY, {
  api_host: POSTHOG_HOST,
  defaults: POSTHOG_DEFAULTS,
  autocapture: false,
});

installGameInputAnalytics();
