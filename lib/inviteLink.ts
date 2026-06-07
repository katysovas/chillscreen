import { SITE_URL } from '@/lib/site';
import type { VenueRoute } from '@/lib/venueRoutes';
import {
  anyStageInView,
  concertLiveTile,
  MID_PARALLAX,
  venueInFocus,
  type VenueKind,
} from '@/lib/venues';
import { isSeattleTile } from '@/lib/worldTiles';

export function venueRouteSlug(route: VenueRoute): string {
  switch (route) {
    case 'coachella':
      return 'Coachella';
    case 'edc':
      return 'edc';
    case 'outside-hands':
      return 'Outside-Hands';
    case 'seattle-concerts':
      return 'Seattle-Concerts';
    case 'cinema':
      return 'Cinema';
  }
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
  }
}

/** Which venue invite link to show for the current scroll position. */
export function activeVenueRoute(
  worldOff: number,
  deepLinkRoute?: VenueRoute,
): VenueRoute | null {
  if (deepLinkRoute) return deepLinkRoute;
  if (!anyStageInView(worldOff)) return null;
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
