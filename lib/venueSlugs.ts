import { HIDDEN_VENUE_SLUGS } from './hiddenVenues';

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
  | 'hula'
  | 'headliner'
  | 'creator-chill'
  | 'creator-cinema';

export function isCreatorTemplateRoute(route: VenueRoute): boolean {
  return route === 'creator-chill' || route === 'creator-cinema';
}

/** Fixed camera — player walks across the screen (no world scroll). */
export function isStaticCityTemplateRoute(route: VenueRoute): boolean {
  return route === 'creator-cinema'
    || route === 'hula'
    || route === 'headliner'
    || route === 'silent-disco'
    || route === 'forest'
    || route === 'tentaroo'
    || route === 'outside-hands'
    || route === 'cinema'
    || route === 'deep-space'
    || route === 'creator-chill'
    || route === 'coachella'
    || route === 'edc'
    || route === 'seattle-concerts';
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
    case 'hula':
      return 'hula';
    case 'headliner':
      return 'headliner';
    case 'creator-chill':
      return 'creator-chill';
    case 'creator-cinema':
      return 'creator-cinema';
  }
}

/** Static paths for `[venue]` pages and sitemap. */
const VENUE_SLUGS_ALL = [
  'thedesert',
  'lasvegas',
  'sanfrancisco',
  'seattle',
  'cinema',
  'space',
  'thefarm',
  'forest',
  'silent-disco',
  'hula',
  'headliner',
] as const;

export const VENUE_SLUGS = VENUE_SLUGS_ALL.filter(
  slug => !(HIDDEN_VENUE_SLUGS as readonly string[]).includes(slug),
);

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
  hula: 'hula',
  hulaween: 'hula',
  headliner: 'headliner',
  'the-headliner': 'headliner',
  'creator-chill': 'creator-chill',
  'creator-cinema': 'creator-cinema',
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
