import type { VenueRoute } from '@/lib/venueRoutes';
import { parseVenueSlug, venueSlugForRoute } from '@/lib/venueRoutes';

export type VenueSeo = {
  title: string;
  description: string;
};

export const VENUE_SEO: Record<VenueRoute, VenueSeo> = {
  coachella: {
    title: 'The Desert',
    description:
      'Walk the desert festival grounds on WhichStage and watch synchronized live sets ' +
      'with other players — no download required.',
  },
  edc: {
    title: 'Las Vegas',
    description:
      'Visit Las Vegas on WhichStage. Walk the Strip, feel the bass, ' +
      'and watch live festival sets with friends in your browser.',
  },
  'outside-hands': {
    title: 'San Francisco',
    description:
      'Catch live sets in San Francisco on WhichStage — a street-side ' +
      'concert stage with a big LED wall.',
  },
  'seattle-concerts': {
    title: 'Seattle',
    description:
      'Explore Seattle on WhichStage and watch live sets at the outdoor festival stage ' +
      'along the Emerald City skyline.',
  },
  cinema: {
    title: 'Chill Cinema',
    description:
      'Visit Chill Cinema in San Francisco on WhichStage — an outdoor movie screen ' +
      'with curated films while you explore the city.',
  },
  tentaroo: {
    title: 'The Farm',
    description:
      'Explore The Farm on WhichStage — campground vibes, the Which Stage main rig, ' +
      'and live Bonnaroo sets with friends in your browser.',
  },
  forest: {
    title: 'The Forest',
    description:
      'Wander The Forest on WhichStage — glowing woods, firefly tent camps, lasers ' +
      'through the pines, and live festival sets with friends in your browser.',
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
