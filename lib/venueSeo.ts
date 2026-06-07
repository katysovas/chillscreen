import type { VenueRoute } from '@/lib/venueRoutes';

export type VenueSeo = {
  title: string;
  description: string;
  slug: string;
};

export const VENUE_SEO: Record<VenueRoute, VenueSeo> = {
  coachella: {
    title: 'Coachella Stage',
    slug: 'Coachella',
    description:
      'Jump straight to the Coachella stage on WhichStage. Explore the desert festival ' +
      'grounds and watch synchronized live sets in your browser.',
  },
  edc: {
    title: 'Electric Daze',
    slug: 'edc',
    description:
      'Visit the Electric Daze stage in Las Vegas on WhichStage. Walk the strip, ' +
      'feel the bass, and watch live EDC-style sets with other players.',
  },
  'outside-hands': {
    title: 'Outside Hands',
    slug: 'Outside-Hands',
    description:
      'Head to Outside Hands in San Francisco on WhichStage. A street-side concert stage ' +
      'with live performances on the big LED wall.',
  },
  'seattle-concerts': {
    title: 'Seattle Concerts',
    slug: 'Seattle-Concerts',
    description:
      'Find Seattle Concerts on WhichStage. Walk the Emerald City and catch live sets ' +
      'at the outdoor festival stage.',
  },
  cinema: {
    title: 'Chill Cinema',
    slug: 'Cinema',
    description:
      'Visit Chill Cinema in San Francisco on WhichStage. An outdoor movie screen ' +
      'playing curated films while you explore the city.',
  },
};

export function venueSeoForRoute(route: VenueRoute): VenueSeo {
  return VENUE_SEO[route];
}

export function venueSeoForSlug(slug: string): VenueSeo | null {
  const normalized = slug.toLowerCase().replace(/_/g, '-');
  for (const seo of Object.values(VENUE_SEO)) {
    if (seo.slug.toLowerCase().replace(/_/g, '-') === normalized) return seo;
  }
  return null;
}
