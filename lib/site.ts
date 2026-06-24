/** Public site URL — override in production via NEXT_PUBLIC_SITE_URL. */
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? 'https://whichstage.com';

export const SITE_NAME = 'WhichStage';

export const SITE_TAGLINE = 'Join the Forever Festival';

export const SITE_DESCRIPTION =
  'WhichStage is a free browser festival world where you explore stages, campgrounds, and glowing forests, ' +
  'watch synchronized live sets, chat with real players and NPCs, and create a festival buddy that stays at the stage when you leave. No download.';

export const SITE_KEYWORDS = [
  'WhichStage',
  'Forever festival',
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
export const LOGO_TRANSPARENT_PATH = '/images/logos/logo_transparent.png';
/** Source PNG dimensions — shared by boot shell and full-size logos. */
export const LOGO_SOURCE_WIDTH = 818;
export const LOGO_SOURCE_HEIGHT = 138;
/** Display size for boot shell logo. */
export const LOGO_DISPLAY_WIDTH = 260;
export const LOGO_DISPLAY_HEIGHT = 44;
/** Pre-downscaled 2× asset for the bottom control pill (260×44 → 130×22 CSS px). */
export const LOGO_BOTTOM_BAR_PATH = '/images/logos/logo_bottom_bar.png';
export const LOGO_BOTTOM_BAR_SOURCE_WIDTH = 260;
export const LOGO_BOTTOM_BAR_SOURCE_HEIGHT = 44;
export const BOTTOM_CONTROL_LOGO_WIDTH = LOGO_BOTTOM_BAR_SOURCE_WIDTH / 2;
export const BOTTOM_CONTROL_LOGO_HEIGHT = LOGO_BOTTOM_BAR_SOURCE_HEIGHT / 2;
export const VENUE_BOOT_OVERLAY_ID = 'venue-boot-overlay';

/** Composed from logo_social.png in app/opengraph-image.tsx — 1200×630 for OG / X cards. */
export const OG_IMAGE_PATH = '/opengraph-image';
export const OG_IMAGE_WIDTH = 1200;
export const OG_IMAGE_HEIGHT = 630;

export const TWITTER_HANDLE = '@aifesties';
export const TWITTER_URL = 'https://x.com/aifesties';
export const DISCORD_URL = 'https://discord.gg/G3cnR3mHQ';

export const CONTACT = {
  support: 'whichstageteam@gmail.com',
} as const;
