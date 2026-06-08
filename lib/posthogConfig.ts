/** PostHog project token (public — safe for client bundle). */
export const POSTHOG_KEY =
  process.env.NEXT_PUBLIC_POSTHOG_KEY ?? 'phc_x5DQfWNwSCWuh22rnDjPYR3JKGBayEMnpXpQbfddTWEp';

export const POSTHOG_HOST =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://us.i.posthog.com';

/** Config snapshot — pageviews via history; autocapture disabled in init. */
export const POSTHOG_DEFAULTS = '2026-05-30' as const;
