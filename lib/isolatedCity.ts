/** One city / stage per URL — bounds, navigation, and PartyKit room scope. */

import { MOBILE_LOUNGE_STAGES } from '@/lib/mobileLounge';
import type { StageAnchorKind } from '@/lib/stageAnchor';
import { cityTileIndex } from '@/lib/spawn';
import type { VenueRoute } from '@/lib/venueSlugs';
import { isCreatorTemplateRoute, venueSlugForRoute } from '@/lib/venueSlugs';
import { worldOffForVenueRoute } from '@/lib/venueRoutes';
import { cinemaMidX, deepSpaceMidX, MID_PARALLAX, VIEW_CENTER_X, VIEW_WIDTH } from '@/lib/venues';
import { midOriginForTile, midWidthForTile, nearGndTiles, TOWN_MID_W } from '@/lib/worldTileGeometry';

/** West-to-east picker order — used for edge navigation and city select. */
export const ISOLATED_CITY_ORDER: VenueRoute[] = MOBILE_LOUNGE_STAGES.map(s => s.route);

export function cityTileForRoute(route: VenueRoute): number {
  switch (route) {
    case 'outside-hands':
    case 'cinema':
    case 'deep-space':
      return cityTileIndex('sf');
    case 'edc':
      return cityTileIndex('vegas');
    case 'coachella':
      return cityTileIndex('san_diego');
    case 'tentaroo':
    case 'creator-chill':
    case 'creator-live':
    case 'creator-cinema':
      return cityTileIndex('tentaroo');
    case 'forest':
      return cityTileIndex('forest');
    case 'silent-disco':
      return cityTileIndex('silent_disco');
    case 'seattle-concerts':
      return cityTileIndex('seattle');
  }
}

export function partyRoomIdForRoute(route: VenueRoute): string {
  return `whichstage-${venueSlugForRoute(route)}`;
}

function fullCityWorldOffBounds(route: VenueRoute): { min: number; max: number } {
  const tile = cityTileForRoute(route);
  const origin = midOriginForTile(tile);
  const width = midWidthForTile(tile);
  return {
    min: (origin - TOWN_MID_W) / MID_PARALLAX,
    max: (origin + width + TOWN_MID_W - VIEW_WIDTH) / MID_PARALLAX,
  };
}

/** Chill Cinema shares the SF tile — keep walk range tight around the cinema. */
function cinemaWorldOffBounds(): { min: number; max: number } {
  const route = 'cinema' as const;
  const tile = cityTileForRoute(route);
  const midX = cinemaMidX(tile);
  if (midX == null) throw new Error('cinema midX missing');

  const full = fullCityWorldOffBounds(route);
  const centerWorldOff = (midOriginForTile(tile) + midX - VIEW_CENTER_X) / MID_PARALLAX;

  const westMidPx = 420;
  const eastMidPx = 320;

  return {
    min: Math.max(full.min, centerWorldOff - westMidPx / MID_PARALLAX),
    max: Math.min(full.max, centerWorldOff + eastMidPx / MID_PARALLAX),
  };
}

/** Deep Space shares the SF tile — keep walk range tight around the stage. */
function deepSpaceWorldOffBounds(): { min: number; max: number } {
  const route = 'deep-space' as const;
  const tile = cityTileForRoute(route);
  const midX = deepSpaceMidX(tile);
  if (midX == null) throw new Error('deep-space midX missing');

  const full = fullCityWorldOffBounds(route);
  const centerWorldOff = (midOriginForTile(tile) + midX - VIEW_CENTER_X) / MID_PARALLAX;

  const westMidPx = 420;
  const eastMidPx = 320;

  return {
    min: Math.max(full.min, centerWorldOff - westMidPx / MID_PARALLAX),
    max: Math.min(full.max, centerWorldOff + eastMidPx / MID_PARALLAX),
  };
}

/** Creator templates — walk the full mid tile without bleeding into connector towns. */
function creatorTemplateWorldOffBounds(route: VenueRoute): { min: number; max: number } {
  const tile = cityTileForRoute(route);
  const origin = midOriginForTile(tile);
  const width = midWidthForTile(tile);
  const full = fullCityWorldOffBounds(route);
  return {
    min: Math.max(full.min, origin / MID_PARALLAX),
    max: Math.min(full.max, (origin + width - VIEW_WIDTH) / MID_PARALLAX),
  };
}

export function cityWorldOffBounds(route: VenueRoute): { min: number; max: number } {
  if (route === 'cinema') return cinemaWorldOffBounds();
  if (route === 'deep-space') return deepSpaceWorldOffBounds();
  if (isCreatorTemplateRoute(route)) return creatorTemplateWorldOffBounds(route);
  return fullCityWorldOffBounds(route);
}

/**
 * Spawn / "back to stage" target — stage-centered worldOff clamped into the
 * city bounds (wide stages like EDC sit near the tile edge and would otherwise
 * push the view past it).
 */
export function stageWorldOffForRoute(route: VenueRoute): number {
  const { min, max } = cityWorldOffBounds(route);
  return Math.max(min, Math.min(max, worldOffForVenueRoute(route)));
}

/**
 * City tile plus its two town connectors. Towns are cheap (no stages, no video
 * embeds) and prevent the world from visibly ending at the city's edges.
 */
export function nearIsolatedMidTiles(
  tileIndex: number,
  route?: VenueRoute,
): (vx: number) => number[] {
  // Deep Space + creator templates — single mid tile (no flanking town/stage art).
  if (route === 'deep-space' || (route && isCreatorTemplateRoute(route))) {
    return () => [tileIndex];
  }
  return () => [tileIndex - 1, tileIndex, tileIndex + 1];
}

/**
 * Ground tiles are generic street art (no stages), and the ground viewBox
 * moves at GND_F=1 — far from `gndOriginForTile(midTileIndex)`. Render the
 * tiles actually under the viewport so the street is always present.
 */
export function nearIsolatedGndTiles(_tileIndex: number, _route?: VenueRoute): (x: number) => number[] {
  return x => nearGndTiles(x);
}

/** World geography (west→east): SF → Vegas → The Desert → The Farm → The Forest → Silent Disco → Seattle. */
const EDGE_ORDER: VenueRoute[] = [
  'outside-hands',
  'edc',
  'coachella',
  'tentaroo',
  'forest',
  'silent-disco',
  'seattle-concerts',
];

function edgeIndexForRoute(route: VenueRoute): number {
  if (isCreatorTemplateRoute(route)) return EDGE_ORDER.indexOf('tentaroo');
  const i = EDGE_ORDER.indexOf(route);
  return i === -1 ? 0 : i; // cinema shares the SF tile
}

export function prevCityRoute(route: VenueRoute): VenueRoute {
  if (route === 'cinema') return 'outside-hands';
  if (route === 'deep-space') return 'cinema';
  const i = edgeIndexForRoute(route);
  return EDGE_ORDER[(i - 1 + EDGE_ORDER.length) % EDGE_ORDER.length]!;
}

export function nextCityRoute(route: VenueRoute): VenueRoute {
  if (route === 'cinema') return 'edc';
  if (route === 'deep-space') return 'edc';
  const i = edgeIndexForRoute(route);
  return EDGE_ORDER[(i + 1) % EDGE_ORDER.length]!;
}

/** Buz cart anchor for this venue page (null = no vendor NPC). */
export function stageAnchorForRoute(route: VenueRoute): StageAnchorKind | null {
  switch (route) {
    case 'outside-hands':
    case 'seattle-concerts':
      return 'concert';
    case 'coachella':
      return 'coachella';
    case 'edc':
      return 'edc';
    case 'tentaroo':
    case 'creator-chill':
    case 'creator-live':
    case 'creator-cinema':
      return 'which-stage';
    case 'forest':
      return 'forest';
    case 'silent-disco':
      return 'silent-disco';
    case 'cinema':
    case 'deep-space':
      return null;
  }
}

/** Synced playback channel for this page's venue (audio stays on city-wide). */
export function stageChannelForRoute(route: VenueRoute):
  'cinema' | 'deep-space' | 'bumbershoot' | 'outside-lands' | 'coachella' | 'edc' | 'which-stage' | 'forest' | 'silent-disco' {
  switch (route) {
    case 'outside-hands': return 'outside-lands';
    case 'seattle-concerts': return 'bumbershoot';
    case 'cinema': return 'cinema';
    case 'deep-space': return 'deep-space';
    case 'coachella': return 'coachella';
    case 'edc': return 'edc';
    case 'tentaroo': return 'which-stage';
    case 'creator-chill': return 'which-stage';
    case 'creator-live': return 'which-stage';
    case 'creator-cinema': return 'which-stage';
    case 'forest': return 'forest';
    case 'silent-disco': return 'silent-disco';
  }
}

export function cityOptionForRoute(route: VenueRoute) {
  return MOBILE_LOUNGE_STAGES.find(s => s.route === route) ?? MOBILE_LOUNGE_STAGES[0]!;
}

/** Random city for the home-page stage backdrop (stable for one page session). */
export function randomPreviewCityRoute(): VenueRoute {
  const order = ISOLATED_CITY_ORDER;
  return order[Math.floor(Math.random() * order.length)]!;
}

