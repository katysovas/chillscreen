import { cityTileIndex } from '@/lib/spawn';
import { isForestTile, isSilentDiscoTile, isSouthernCaliforniaTile, isTentarooTile, isVegasTile } from '@/lib/worldTiles';
import { cinemaMidX, coachellaMidX, concertMidX, deepSpaceMidX, edcMidX, whichStageMidX, MID_PARALLAX, VIEW_CENTER_X, type VenueKind } from '@/lib/venues';
import { midOriginForTile } from '@/lib/worldTileGeometry';
import { WHICH_STAGE_MID_X } from '@/components/game/city/tentaroo/constants';
import { FOREST_STAGE_MID_X } from '@/components/game/city/forest/constants';
import { SILENT_DISCO_STAGE_MID_X } from '@/components/game/city/silent-disco/constants';
export type { VenueRoute } from '@/lib/venueSlugs';
export {
  parseVenueSlug,
  VENUE_SLUGS,
  venueSlugForRoute,
  canonicalVenueSlug,
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
    case 'deep-space': {
      const tile = cityTileIndex('sf');
      const midX = deepSpaceMidX(tile);
      if (midX == null) throw new Error('deep-space midX missing');
      return worldOffCenteringMidX(tile, midX);
    }
    case 'tentaroo': {
      const tile = cityTileIndex('tentaroo');
      return worldOffCenteringMidX(tile, WHICH_STAGE_MID_X);
    }
    case 'forest': {
      const tile = cityTileIndex('forest');
      return worldOffCenteringMidX(tile, FOREST_STAGE_MID_X);
    }
    case 'silent-disco': {
      const tile = cityTileIndex('silent_disco');
      return worldOffCenteringMidX(tile, SILENT_DISCO_STAGE_MID_X);
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
  whichStageLive: number,
  forestLive: number,
  silentDiscoLive: number,
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
    case 'which-stage':
      return tileIndex === whichStageLive;
    case 'forest':
      return tileIndex === forestLive;
    case 'silent-disco':
      return tileIndex === silentDiscoLive;
    case 'deep-space':
      return false;
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
    case 'deep-space':
      return kind === 'deep-space' && tileIndex === cityTileIndex('sf');
    case 'outside-hands':
      return kind === 'concert' && tileIndex === cityTileIndex('sf');
    case 'seattle-concerts':
      return kind === 'concert' && tileIndex === cityTileIndex('seattle');
    case 'coachella':
      return kind === 'coachella' && isSouthernCaliforniaTile(tileIndex);
    case 'edc':
      return kind === 'edc' && isVegasTile(tileIndex);
    case 'tentaroo':
      return kind === 'which-stage' && isTentarooTile(tileIndex);
    case 'forest':
      return kind === 'forest' && isForestTile(tileIndex);
    case 'silent-disco':
      return kind === 'silent-disco' && isSilentDiscoTile(tileIndex);
  }
}

export function isVenueLive(
  kind: VenueKind,
  tileIndex: number,
  cinemaLive: number,
  concertLive: number,
  coachellaLive: number,
  edcLive: number,
  whichStageLive: number,
  forestLive: number,
  silentDiscoLive: number,
  focus: VenueKind,
  deepLinkRoute?: VenueRoute,
): boolean {
  if (deepLinkRoute === 'cinema') {
    return isDeepLinkVenueLive('cinema', kind, tileIndex);
  }
  if (deepLinkRoute === 'deep-space') {
    return isDeepLinkVenueLive('deep-space', kind, tileIndex);
  }
  if (deepLinkRoute && isDeepLinkVenueLive(deepLinkRoute, kind, tileIndex)) {
    return true;
  }
  return isScrollVenueLive(
    kind, tileIndex, cinemaLive, concertLive, coachellaLive, edcLive, whichStageLive, forestLive, silentDiscoLive, focus,
  );
}
