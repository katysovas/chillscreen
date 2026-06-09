import posthog from 'posthog-js';
import { POSTHOG_DEFAULTS, POSTHOG_HOST, POSTHOG_KEY } from '@/lib/posthogConfig';

posthog.init(POSTHOG_KEY, {
  api_host: POSTHOG_HOST,
  defaults: POSTHOG_DEFAULTS,
  autocapture: false,
});
