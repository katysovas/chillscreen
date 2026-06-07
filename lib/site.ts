/** Public site URL — override in production via NEXT_PUBLIC_SITE_URL. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://whichstage.com';

export const SITE_NAME = 'WhichStage';

export const SITE_TAGLINE = 'Explore cities. Watch live shows. Make friends.';

export const SITE_DESCRIPTION =
  'WhichStage is a browser-based festival world where you walk through cities, ' +
  'watch live stages, meet NPCs, and chat with other players. No download required.';

export const SITE_KEYWORDS = [
  'WhichStage',
  'festival game',
  'live music game',
  'browser game',
  'Coachella',
  'EDC',
  'virtual festival',
  'multiplayer walking game',
  'San Francisco game',
  'live stages',
];

export const FAVICON_PATH = '/images/favicon.svg';
export const LOGO_PATH = '/images/logo_dark.svg';

export const TWITTER_HANDLE = '@whichstage';

export const CONTACT = {
  support: 'support@whichstage.com',
  privacy: 'privacy@whichstage.com',
} as const;
