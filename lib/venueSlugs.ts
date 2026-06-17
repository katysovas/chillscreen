/** Deep-linkable venue destinations. */
export type VenueRoute =
  | 'coachella'
  | 'edc'
  | 'outside-hands'
  | 'seattle-concerts'
  | 'cinema'
  | 'deep-space'
  | 'tentaroo'
  | 'forest'
  | 'silent-disco'
  | 'creator-chill'
  | 'creator-cinema';

export function isCreatorTemplateRoute(route: VenueRoute): boolean {
  return route === 'creator-chill' || route === 'creator-cinema';
}

/** City template — fixed camera; player walks across the screen. */
export function isStaticCityTemplateRoute(route: VenueRoute): boolean {
  return route === 'creator-cinema';
}

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
      return 'cinema';
    case 'deep-space':
      return 'space';
    case 'tentaroo':
      return 'thefarm';
    case 'forest':
      return 'forest';
    case 'silent-disco':
      return 'silent-disco';
    case 'creator-chill':
      return 'creator-chill';
    case 'creator-cinema':
      return 'creator-cinema';
  }
}

/** Static paths for `[venue]` pages and sitemap. */
export const VENUE_SLUGS = [
  'thedesert',
  'lasvegas',
  'sanfrancisco',
  'seattle',
  'cinema',
  'space',
  'thefarm',
  'forest',
  'silent-disco',
] as const;

const SLUG_TO_ROUTE: Record<string, VenueRoute> = {
  thedesert: 'coachella',
  lasvegas: 'edc',
  sanfrancisco: 'outside-hands',
  seattle: 'seattle-concerts',
  cinema: 'cinema',
  'chill-cinema': 'cinema',
  space: 'deep-space',
  thefarm: 'tentaroo',
  forest: 'forest',
  'the-forest': 'forest',
  theforest: 'forest',
  'silent-disco': 'silent-disco',
  silentdisco: 'silent-disco',
};

/** Parse a URL segment like `thedesert`. */
export function parseVenueSlug(slug: string): VenueRoute | null {
  return SLUG_TO_ROUTE[slug.toLowerCase().replace(/_/g, '-')] ?? null;
}

/** Canonical path slug — maps legacy URLs (e.g. chill-cinema → cinema). */
export function canonicalVenueSlug(slug: string): string {
  const key = slug.toLowerCase().replace(/_/g, '-');
  if (key === 'chill-cinema') return 'cinema';
  return key;
}
