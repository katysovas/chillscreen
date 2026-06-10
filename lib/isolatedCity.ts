/** One city / stage per URL — bounds, navigation, and PartyKit room scope. */

import { MOBILE_LOUNGE_STAGES } from '@/lib/mobileLounge';
import { cityTileIndex } from '@/lib/spawn';
import type { VenueRoute } from '@/lib/venueSlugs';
import { venueSlugForRoute } from '@/lib/venueSlugs';
import { worldOffForVenueRoute } from '@/lib/venueRoutes';
import { MID_PARALLAX, VIEW_WIDTH } from '@/lib/venues';
import { midOriginForTile, midWidthForTile, nearGndTiles, TOWN_MID_W } from '@/lib/worldTileGeometry';

/** West-to-east picker order — used for edge navigation and city select. */
export const ISOLATED_CITY_ORDER: VenueRoute[] = MOBILE_LOUNGE_STAGES.map(s => s.route);

export function cityTileForRoute(route: VenueRoute): number {
  switch (route) {
    case 'outside-hands':
    case 'cinema':
      return cityTileIndex('sf');
    case 'edc':
      return cityTileIndex('vegas');
    case 'coachella':
      return cityTileIndex('san_diego');
    case 'tentaroo':
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

/**
 * Walk bounds in worldOff units — derived from the MID tile, which defines the
 * city's visual extent (mid vx = worldOff * MID_PARALLAX). The rendered art
 * spans the city tile plus its two town connectors; these bounds keep the view
 * fully covered so the world never visibly ends, while letting the player walk
 * past the city edge into the connector town.
 */
export function cityWorldOffBounds(route: VenueRoute): { min: number; max: number } {
  const tile = cityTileForRoute(route);
  const origin = midOriginForTile(tile);
  const width = midWidthForTile(tile);
  return {
    min: (origin - TOWN_MID_W) / MID_PARALLAX,
    max: (origin + width + TOWN_MID_W - VIEW_WIDTH) / MID_PARALLAX,
  };
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
export function nearIsolatedMidTiles(tileIndex: number): (vx: number) => number[] {
  return () => [tileIndex - 1, tileIndex, tileIndex + 1];
}

/**
 * Ground tiles are generic street art (no stages), and the ground viewBox
 * moves at GND_F=1 — far from `gndOriginForTile(midTileIndex)`. Render the
 * tiles actually under the viewport so the street is always present.
 */
export function nearIsolatedGndTiles(_tileIndex: number): (x: number) => number[] {
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
  const i = EDGE_ORDER.indexOf(route);
  return i === -1 ? 0 : i; // cinema shares the SF tile
}

export function prevCityRoute(route: VenueRoute): VenueRoute {
  const i = edgeIndexForRoute(route);
  return EDGE_ORDER[(i - 1 + EDGE_ORDER.length) % EDGE_ORDER.length]!;
}

export function nextCityRoute(route: VenueRoute): VenueRoute {
  const i = edgeIndexForRoute(route);
  return EDGE_ORDER[(i + 1) % EDGE_ORDER.length]!;
}

/** Synced playback channel for this page's venue (audio stays on city-wide). */
export function stageChannelForRoute(route: VenueRoute):
  'cinema' | 'bumbershoot' | 'outside-lands' | 'coachella' | 'edc' | 'which-stage' | 'forest' | 'silent-disco' {
  switch (route) {
    case 'outside-hands': return 'outside-lands';
    case 'seattle-concerts': return 'bumbershoot';
    case 'cinema': return 'cinema';
    case 'coachella': return 'coachella';
    case 'edc': return 'edc';
    case 'tentaroo': return 'which-stage';
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

