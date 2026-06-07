import { cityTileIndex } from '@/lib/spawn';
import { isSouthernCaliforniaTile, isVegasTile } from '@/lib/worldTiles';
import { cinemaMidX, coachellaMidX, concertMidX, edcMidX, MID_PARALLAX, VIEW_CENTER_X, type VenueKind } from '@/lib/venues';
import { midOriginForTile } from '@/lib/worldTileGeometry';
export type { VenueRoute } from '@/lib/venueSlugs';
export {
  parseVenueSlug,
  VENUE_SLUGS,
  venueSlugForRoute,
} from '@/lib/venueSlugs';
import type { VenueRoute } from '@/lib/venueSlugs';

/** Ground scroll offset that centers a mid-layer anchor in the viewport. */
function worldOffCenteringMidX(tile: number, midX: number): number {
  const worldX = midOriginForTile(tile) + midX;
  const vx = worldX - VIEW_CENTER_X;
  return vx / MID_PARALLAX;
}

/** World offset that places the player in front of the given venue. */
export function worldOffForVenueRoute(route: VenueRoute): number {
  switch (route) {
    case 'coachella': {
      const tile = cityTileIndex('coachella');
      const midX = coachellaMidX(tile);
      if (midX == null) throw new Error('coachella midX missing');
      return worldOffCenteringMidX(tile, midX);
    }
    case 'edc': {
      const tile = cityTileIndex('vegas');
      const midX = edcMidX(tile);
      if (midX == null) throw new Error('edc midX missing');
      return worldOffCenteringMidX(tile, midX);
    }
    case 'outside-hands': {
      const tile = cityTileIndex('sf');
      const midX = concertMidX(tile);
      if (midX == null) throw new Error('outside-hands midX missing');
      return worldOffCenteringMidX(tile, midX);
    }
    case 'seattle-concerts': {
      const tile = cityTileIndex('seattle');
      const midX = concertMidX(tile);
      if (midX == null) throw new Error('seattle-concerts midX missing');
      return worldOffCenteringMidX(tile, midX);
    }
    case 'cinema': {
      const tile = cityTileIndex('sf');
      const midX = cinemaMidX(tile);
      if (midX == null) throw new Error('cinema midX missing');
      return worldOffCenteringMidX(tile, midX);
    }
  }
}

/** Whether a venue should be live on `tileIndex` for scroll-based playback. */
export function isScrollVenueLive(
  kind: VenueKind,
  tileIndex: number,
  cinemaLive: number,
  concertLive: number,
  coachellaLive: number,
  edcLive: number,
  focus: VenueKind,
): boolean {
  switch (kind) {
    case 'cinema':
      return tileIndex === cinemaLive;
    case 'concert':
      return tileIndex === concertLive && focus === 'concert';
    case 'coachella':
      return tileIndex === coachellaLive && focus === 'coachella';
    case 'edc':
      return tileIndex === edcLive && focus === 'edc';
  }
}

/**
 * Deep-link override: the pinned venue is live on first paint without waiting
 * for scroll/focus heuristics to catch up.
 */
export function isDeepLinkVenueLive(
  route: VenueRoute,
  kind: VenueKind,
  tileIndex: number,
): boolean {
  switch (route) {
    case 'cinema':
      return kind === 'cinema' && tileIndex === cityTileIndex('sf');
    case 'outside-hands':
      return kind === 'concert' && tileIndex === cityTileIndex('sf');
    case 'seattle-concerts':
      return kind === 'concert' && tileIndex === cityTileIndex('seattle');
    case 'coachella':
      return kind === 'coachella' && isSouthernCaliforniaTile(tileIndex);
    case 'edc':
      return kind === 'edc' && isVegasTile(tileIndex);
  }
}

export function isVenueLive(
  kind: VenueKind,
  tileIndex: number,
  cinemaLive: number,
  concertLive: number,
  coachellaLive: number,
  edcLive: number,
  focus: VenueKind,
  deepLinkRoute?: VenueRoute,
): boolean {
  if (deepLinkRoute && isDeepLinkVenueLive(deepLinkRoute, kind, tileIndex)) {
    return true;
  }
  return isScrollVenueLive(kind, tileIndex, cinemaLive, concertLive, coachellaLive, edcLive, focus);
}
