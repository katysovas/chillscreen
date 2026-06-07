/** Deep-linkable venue destinations. */
export type VenueRoute =
  | 'coachella'
  | 'edc'
  | 'outside-hands'
  | 'seattle-concerts'
  | 'cinema';

/** Canonical URL path segments — slugified in-game venue names. */
export function venueSlugForRoute(route: VenueRoute): string {
  switch (route) {
    case 'coachella':
      return 'couchella';
    case 'edc':
      return 'electric-daze';
    case 'outside-hands':
      return 'outside-hands';
    case 'seattle-concerts':
      return 'seattle-concerts';
    case 'cinema':
      return 'chill-cinema';
  }
}

/** Static paths for `[venue]` pages and sitemap. */
export const VENUE_SLUGS = [
  'couchella',
  'electric-daze',
  'outside-hands',
  'seattle-concerts',
  'chill-cinema',
] as const;

const SLUG_TO_ROUTE: Record<string, VenueRoute> = {
  couchella: 'coachella',
  coachella: 'coachella',
  'electric-daze': 'edc',
  edc: 'edc',
  'outside-hands': 'outside-hands',
  'seattle-concerts': 'seattle-concerts',
  'chill-cinema': 'cinema',
  cinema: 'cinema',
};

/** Parse a URL segment like `couchella` or legacy `Coachella`. */
export function parseVenueSlug(slug: string): VenueRoute | null {
  return SLUG_TO_ROUTE[slug.toLowerCase().replace(/_/g, '-')] ?? null;
}
