import { SITE_URL } from '@/lib/site';
import type { VenueRoute } from '@/lib/venueRoutes';
import { venueSlugForRoute } from '@/lib/venueRoutes';
import {
  concertLiveTile,
  MID_PARALLAX,
  venueInFocus,
  type VenueKind,
} from '@/lib/venues';
import { isSeattleTile } from '@/lib/worldTiles';

export function venueRouteSlug(route: VenueRoute): string {
  return venueSlugForRoute(route);
}

export function venueKindToRoute(kind: VenueKind, concertTile: number): VenueRoute {
  switch (kind) {
    case 'edc':
      return 'edc';
    case 'coachella':
      return 'coachella';
    case 'cinema':
      return 'cinema';
    case 'concert':
      return isSeattleTile(concertTile) ? 'seattle-concerts' : 'outside-hands';
    case 'which-stage':
      return 'tentaroo';
    case 'forest':
      return 'forest';
    case 'silent-disco':
      return 'silent-disco';
  }
}

/** Which venue invite link to show for the current scroll position. */
export function activeVenueRoute(
  worldOff: number,
  deepLinkRoute?: VenueRoute,
): VenueRoute {
  if (deepLinkRoute) return deepLinkRoute;
  const vx = worldOff * MID_PARALLAX;
  return venueKindToRoute(venueInFocus(vx), concertLiveTile(vx));
}

export function buildInviteUrl(route: VenueRoute, playerName: string | null): string {
  const slug = venueRouteSlug(route);
  const friend = encodeURIComponent(playerName?.trim() || 'friend');
  return `${SITE_URL}/${slug}?friend=${friend}`;
}

/** Pretty display — drop the scheme for a shorter copy line. */
export function inviteLinkLabel(url: string): string {
  return url.replace(/^https?:\/\//, '');
}
