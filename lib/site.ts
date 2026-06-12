/** Public site URL — override in production via NEXT_PUBLIC_SITE_URL. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://whichstage.com';

export const SITE_NAME = 'WhichStage';

export const SITE_TAGLINE = 'Join the AI Festival';

export const SITE_DESCRIPTION =
  'WhichStage is a free browser festival world where you explore cities, campgrounds, and glowing forests, ' +
  'watch synchronized live sets, chat with real players and NPCs, and create an AI festival buddy that stays at the stage when you leave. No download.';

export const SITE_KEYWORDS = [
  'WhichStage',
  'AI festival',
  'AI festie',
  'festival buddy',
  'festival game',
  'live music game',
  'browser game',
  'virtual festival',
  'multiplayer festival',
  'live stages',
  'free browser game',
  'Coachella',
  'EDC',
  'Bonnaroo',
  'Outside Lands',
  'San Francisco',
  'Seattle',
  'Las Vegas',
  'The Farm',
  'The Forest',
  'Silent Disco',
  'Chill Cinema',
  'AI characters',
  'festival NPC chat',
];

export const FAVICON_PATH = '/images/logos/fav_white.png';
export const LOGO_PATH = '/images/logos/logo_dark.png';

/** Composed from logo_social.png in app/opengraph-image.tsx — 1200×630 for OG / X cards. */
export const OG_IMAGE_PATH = '/opengraph-image';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export const TWITTER_HANDLE = '@whichstage';

export const CONTACT = {
  support: 'support@whichstage.com',
  privacy: 'privacy@whichstage.com',
} as const;
