import type { VenueRoute } from '@/lib/venueRoutes';
import { parseVenueSlug, venueSlugForRoute } from '@/lib/venueRoutes';

export type VenueSeo = {
  /** Short stage name — breadcrumbs, invites, UI */
  title: string;
  /** Keyword-rich page title (site name appended in metadata) */
  metaTitle: string;
  /** Meta description (~150–160 characters) */
  description: string;
  /** Longer copy for JSON-LD, HTML sitemap, and discoverability */
  longDescription: string;
  keywords: string[];
};

export const VENUE_SEO: Record<VenueRoute, VenueSeo> = {
  coachella: {
    title: 'The Desert',
    metaTitle: 'The Desert Festival Stage — Live Sets & AI Festies',
    description:
      'Walk desert festival grounds on WhichStage. Watch synchronized live sets, chat with players, and create an AI festival buddy that stays on stage. Free in your browser.',
    longDescription:
      'The Desert is WhichStage\'s Coachella-inspired main stage — palm trees, golden hour skies, and a massive rig streaming live festival sets. ' +
      'Explore on foot, shout to the crowd, meet NPCs, and leave your AI festie vibing at the stage when you log off. No download required.',
    keywords: [
      'Coachella stage',
      'desert festival game',
      'live festival sets',
      'browser festival',
      'Southern California festival',
      'AI festie',
    ],
  },
  edc: {
    title: 'Las Vegas',
    metaTitle: 'Las Vegas EDC Stage — Live Sets & AI Festies',
    description:
      'Hit the Las Vegas strip stage on WhichStage. Neon lights, bass-heavy live sets, multiplayer vibes, and your AI festie keeps the party going after you leave.',
    longDescription:
      'Las Vegas on WhichStage brings Electric Daisy Carnival energy to your browser — lasers, LED walls, and synchronized live DJ sets on the Strip. ' +
      'Walk with other players, trade chats with crowd NPCs, and deploy an AI festival buddy who hangs at the stage while you\'re away.',
    keywords: [
      'EDC Las Vegas',
      'Las Vegas festival game',
      'EDM stage browser',
      'neon festival',
      'live DJ sets',
      'AI festival buddy',
    ],
  },
  'outside-hands': {
    title: 'San Francisco',
    metaTitle: 'San Francisco Outdoor Concert Stage — Live Music & AI Festies',
    description:
      'Catch live sets at the San Francisco outdoor stage on WhichStage. Street-side LED wall, multiplayer festival world, and AI festies that stay after you leave.',
    longDescription:
      'San Francisco\'s outdoor concert stage on WhichStage sits along the city skyline with a big LED wall and rolling live sets. ' +
      'Blend into the crowd, connect with other festival-goers, and create an AI festie who keeps vibing at the stage for 24 hours when you sign off.',
    keywords: [
      'San Francisco concert',
      'SF live music game',
      'outdoor concert stage',
      'Bay Area festival',
      'browser concert',
      'AI festie San Francisco',
    ],
  },
  'seattle-concerts': {
    title: 'Seattle',
    metaTitle: 'Seattle Festival Stage — Emerald City Live Sets & AI Festies',
    description:
      'Explore Seattle on WhichStage. Watch live sets at the Emerald City festival stage, chat with players, and leave an AI festie on stage when you go.',
    longDescription:
      'Seattle\'s festival stage on WhichStage pairs Pacific Northwest skyline views with a waterfront concert rig and synchronized live performances. ' +
      'Stroll the grounds, jump into ambient chat, and assign an AI festival buddy to represent you at the stage while you\'re offline.',
    keywords: [
      'Seattle concerts',
      'Emerald City stage',
      'Seattle festival game',
      'live sets Seattle',
      'multiplayer music game',
      'AI festie',
    ],
  },
  cinema: {
    title: 'Chill Cinema',
    metaTitle: 'Chill Cinema — Outdoor Movie Screen & AI Festival World',
    description:
      'Visit Chill Cinema in San Francisco on WhichStage. Curated films on an outdoor screen, festival exploration, and AI festies at live stages nearby.',
    longDescription:
      'Chill Cinema is WhichStage\'s outdoor movie lawn in San Francisco — a giant screen, curated film picks, and the full city to explore between showings. ' +
      'Watch with friends in the browser, wander to concert stages, and create an AI festie who keeps the festival energy alive when you step away.',
    keywords: [
      'outdoor cinema',
      'San Francisco movies',
      'browser film night',
      'chill cinema game',
      'virtual festival',
      'AI festie',
    ],
  },
  'deep-space': {
    title: 'Deep Space',
    metaTitle: 'Deep Space — Cosmic Orbit Stage & AI Festies',
    description:
      'Float into Deep Space on WhichStage. A cosmic orbit stage with live sets, space-themed NPCs, and AI festies vibing under the stars. Free in your browser.',
    longDescription:
      'Deep Space is WhichStage\'s cosmic orbit venue — teal nebula skies, floating planets, and a massive screen streaming live sets from the void. ' +
      'Explore the orbit deck with other players, chat with space-themed NPCs, and leave an AI festie drifting near the stage when you log off.',
    keywords: [
      'space stage game',
      'cosmic orbit browser',
      'deep space festival',
      'ambient space music',
      'multiplayer space game',
      'AI festie',
    ],
  },
  tentaroo: {
    title: 'The Farm',
    metaTitle: 'The Farm & Which Stage — Bonnaroo Live Sets & AI Festies',
    description:
      'Camp at The Farm on WhichStage. Which Stage main rig, campground vibes, live Bonnaroo sets, and an AI festie who stays at the festival for you.',
    longDescription:
      'The Farm recreates Bonnaroo campground energy on WhichStage — Which Stage towers over tent city, live sets roll on schedule, and fireflies dot the fields. ' +
      'Meet other campers online, chat with festie NPCs, and leave your AI festival buddy wandering the stage after you log out.',
    keywords: [
      'Bonnaroo game',
      'The Farm festival',
      'Which Stage',
      'campground festival browser',
      'Tennessee festival vibes',
      'AI festival buddy',
    ],
  },
  forest: {
    title: 'The Forest',
    metaTitle: 'The Forest Stage — Glowing Woods Live Sets & AI Festies',
    description:
      'Wander The Forest on WhichStage. Glowing pines, firefly camps, laser-lit live sets, and AI festies that keep exploring while you\'re away.',
    longDescription:
      'The Forest is WhichStage\'s enchanted woodland venue — bioluminescent trees, tent villages, and a hidden stage pulsing with live festival sets and lasers. ' +
      'Explore with friends, talk to the crowd, and spawn an AI festie who roams the woods and chats with visitors for up to 24 hours after you leave.',
    keywords: [
      'forest festival',
      'glowing woods stage',
      'immersive festival game',
      'laser forest rave',
      'browser adventure music',
      'AI festie',
    ],
  },
  'silent-disco': {
    title: 'Silent Disco',
    metaTitle: 'Silent Disco Headphone Rave — Live DJ Sets & AI Festies',
    description:
      'Join the Silent Disco on WhichStage. Headphone rave under a dark sky, glowsticks, live DJ sets, multiplayer chat, and AI festies on the floor.',
    longDescription:
      'Silent Disco on WhichStage is a headphone rave under a starry sky — glowing headsets, disco balls, and synchronized live DJ sets you watch together in the browser. ' +
      'Dance through the crowd, shout ambient lines, and leave an AI festie nodding along at the stage when you sign out.',
    keywords: [
      'silent disco game',
      'headphone rave',
      'browser DJ party',
      'glowstick festival',
      'multiplayer dance game',
      'AI festie',
    ],
  },
  'creator-chill': {
    title: 'Chill Stage',
    metaTitle: 'Chill Creator Stage — Custom Sets & AI Festies',
    description: 'A relaxed creator stage on WhichStage.',
    longDescription: 'Custom creator stage template with open-field chill vibes.',
    keywords: ['creator stage', 'chill stage'],
  },
  'creator-cinema': {
    title: 'City Stage',
    metaTitle: 'City Creator Stage — Custom Sets & AI Festies',
    description: 'An urban skyline creator stage on WhichStage.',
    longDescription: 'Custom creator stage template with animated city skyline backdrop.',
    keywords: ['creator stage', 'city stage'],
  },
  hula: {
    title: 'Hulaween',
    metaTitle: 'Hulaween Stage — Live Sets & AI Festies',
    description:
      'Hula family hangout.',
    longDescription:
      'The Hulaween stage on WhichStage streams full festival sets from Suwannee — String Cheese, Pretty Lights, Zeds Dead, CloZee, and more — synchronized for everyone in the room. ' +
      'Walk the grounds, shout to the crowd, and deploy an AI festie who keeps vibing while you\'re away.',
    keywords: [
      'Hulaween',
      'Suwannee festival',
      'festival live sets',
      'browser festival game',
      'AI festie',
    ],
  },
};

export function venueSeoForRoute(route: VenueRoute): VenueSeo {
  return VENUE_SEO[route];
}

export function venueSeoForSlug(slug: string): VenueSeo | null {
  const route = parseVenueSlug(slug);
  return route ? venueSeoForRoute(route) : null;
}

export function venuePathForRoute(route: VenueRoute): string {
  return `/${venueSlugForRoute(route)}`;
}

/** All stage entries for sitemaps, feeds, and index pages. */
export function allStageSeoEntries(): Array<VenueSeo & { route: VenueRoute; slug: string; path: string }> {
  return (Object.keys(VENUE_SEO) as VenueRoute[])
    .filter(route => !route.startsWith('creator-'))
    .map(route => ({
    route,
    slug: venueSlugForRoute(route),
    path: venuePathForRoute(route),
    ...VENUE_SEO[route],
  }));
}
