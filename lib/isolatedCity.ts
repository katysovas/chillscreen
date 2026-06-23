/** One city / stage per URL — bounds, navigation, and PartyKit room scope. */

import { MOBILE_LOUNGE_STAGES } from '@/lib/mobileLounge';
import type { StageAnchorKind } from '@/lib/stageAnchor';
import { cityTileIndex } from '@/lib/spawn';
import type { VenueRoute } from '@/lib/venueSlugs';
import { screenPctToWorldX } from '@/lib/gameWorldRef';
import { isCreatorTemplateRoute, venueSlugForRoute } from '@/lib/venueSlugs';
import { worldOffForVenueRoute } from '@/lib/venueRoutes';
import { VIEW_CENTER_X, VIEW_WIDTH } from '@/lib/venues';
import { nearGndTiles } from '@/lib/worldTileGeometry';

/**
 * Distance from the viewport edge at which nav signs are planted (shared with
 * CityNavSigns). VIEW_CENTER_X is the character's fixed screen position.
 */
export const SIGN_EDGE_INSET_PX = 260;

/** Screen-edge inset for static city template — matches walk bounds. */
export const STATIC_CITY_EDGE_INSET_PCT = 5;

/** Extra inward padding for static city nav signs (screen px → viewBox). */
export const STATIC_SIGN_EDGE_PADDING_PX = 6;

/** Sign wing reach in ground viewBox units (compact static board). */
export const STATIC_SIGN_WING_VB = 100;

/** Walk-edge inset for sign placement only — signs sit slightly inside walk bounds. */
export const STATIC_SIGN_EDGE_INSET_PCT = 2;

/** Visible slice of the 1400×900 ground viewBox after `xMidYMid slice` scaling. */
export function visibleGroundViewBoxSlice(
  viewportWidth: number,
  viewportHeight: number,
): { vbLeft: number; vbWidth: number; scale: number } {
  const scale = Math.max(viewportWidth / VIEW_WIDTH, viewportHeight / 900);
  const vbWidth = viewportWidth / scale;
  const vbLeft = VIEW_CENTER_X - vbWidth / 2;
  return { vbLeft, vbWidth, scale };
}

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
    case 'creator-cinema':
    case 'hula':
    case 'headliner':
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

/** Fixed camera — player walks across the screen at every venue. */
export function cityWorldOffBounds(route: VenueRoute): { min: number; max: number } {
  const off = worldOffForVenueRoute(route);
  return { min: off, max: off };
}

/** Walk range for the local player when the camera is fixed (screen-edge bounds). */
export function staticCityPlayerWorldBounds(
  cameraOff: number,
  viewportWidth: number,
  edgeInsetPct = STATIC_CITY_EDGE_INSET_PCT,
): { min: number; max: number } {
  return {
    min: screenPctToWorldX(edgeInsetPct, cameraOff, viewportWidth),
    max: screenPctToWorldX(100 - edgeInsetPct, cameraOff, viewportWidth),
  };
}

/** Ground-layer x for prev/next signs on static stages — inset from the visible screen edges. */
export function staticCitySignGroundX(
  cameraOff: number,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : VIEW_WIDTH,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 900,
): { leftX: number; rightX: number } {
  const { vbLeft, vbWidth, scale } = visibleGroundViewBoxSlice(viewportWidth, viewportHeight);
  const walkInsetVb = (STATIC_SIGN_EDGE_INSET_PCT / 100) * vbWidth
    + STATIC_SIGN_EDGE_PADDING_PX / scale;
  const insetVb = walkInsetVb + STATIC_SIGN_WING_VB;
  return {
    leftX: cameraOff + vbLeft + insetVb,
    rightX: cameraOff + vbLeft + vbWidth - insetVb,
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
export function nearIsolatedMidTiles(
  tileIndex: number,
  _route?: VenueRoute,
): (vx: number) => number[] {
  return () => [tileIndex];
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
  if (isCreatorTemplateRoute(route) || route === 'hula' || route === 'headliner') return EDGE_ORDER.indexOf('tentaroo');
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
    case 'creator-cinema':
    case 'hula':
      return 'which-stage';
    case 'headliner':
      return null;
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
  'cinema' | 'deep-space' | 'bumbershoot' | 'outside-lands' | 'coachella' | 'edc' | 'which-stage' | 'forest' | 'silent-disco' | 'hula' | 'headliner' {
  switch (route) {
    case 'outside-hands': return 'outside-lands';
    case 'seattle-concerts': return 'bumbershoot';
    case 'cinema': return 'cinema';
    case 'deep-space': return 'deep-space';
    case 'coachella': return 'coachella';
    case 'edc': return 'edc';
    case 'tentaroo': return 'which-stage';
    case 'creator-chill': return 'which-stage';
    case 'creator-cinema': return 'which-stage';
    case 'hula': return 'hula';
    case 'headliner': return 'headliner';
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

