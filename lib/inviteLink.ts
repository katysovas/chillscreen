import { SITE_URL } from '@/lib/site';
import { stagePathForSlug } from '@/lib/stages/runtime';
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
    case 'deep-space':
      return 'deep-space';
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

/** Origin for invite links — current page in the browser, else configured site URL. */
export function inviteSiteOrigin(): string {
  if (typeof window !== 'undefined') return window.location.origin;
  return SITE_URL;
}

export function buildInviteUrl(
  route: VenueRoute,
  playerName: string | null,
  creatorStageSlug?: string | null,
): string {
  const base = inviteSiteOrigin();
  const friend = encodeURIComponent(playerName?.trim() || 'friend');
  if (creatorStageSlug?.trim()) {
    return `${base}${stagePathForSlug(creatorStageSlug.trim().toLowerCase())}?friend=${friend}`;
  }
  const slug = venueRouteSlug(route);
  return `${base}/${slug}?friend=${friend}`;
}

/** Pretty display — drop the scheme for a shorter copy line. */
export function inviteLinkLabel(url: string): string {
  return url.replace(/^https?:\/\//, '');
}
