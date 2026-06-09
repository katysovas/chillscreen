/** Deep-linkable venue destinations. */
export type VenueRoute =
  | 'coachella'
  | 'edc'
  | 'outside-hands'
  | 'seattle-concerts'
  | 'cinema'
  | 'tentaroo';

/** Canonical URL path segments — slugified in-game venue names. */
export function venueSlugForRoute(route: VenueRoute): string {
  switch (route) {
    case 'coachella':
      return 'thedesert';
    case 'edc':
      return 'lasvegas';
    case 'outside-hands':
      return 'sanfrancisco';
    case 'seattle-concerts':
      return 'seattle';
    case 'cinema':
      return 'chill-cinema';
    case 'tentaroo':
      return 'thefarm';
  }
}

/** Static paths for `[venue]` pages and sitemap. */
export const VENUE_SLUGS = [
  'thedesert',
  'lasvegas',
  'sanfrancisco',
  'seattle',
  'chill-cinema',
  'thefarm',
] as const;

const SLUG_TO_ROUTE: Record<string, VenueRoute> = {
  thedesert: 'coachella',
  lasvegas: 'edc',
  sanfrancisco: 'outside-hands',
  seattle: 'seattle-concerts',
  'chill-cinema': 'cinema',
  thefarm: 'tentaroo',
};

/** Parse a URL segment like `thedesert`. */
export function parseVenueSlug(slug: string): VenueRoute | null {
  return SLUG_TO_ROUTE[slug.toLowerCase().replace(/_/g, '-')] ?? null;
}
