import {
  isCoachellaTile,
  isSanFranciscoTile,
  isSeattleTile,
  isTentarooTile,
  isVegasTile,
  nearestStageCityTile,
  nearestTileOfKind,
} from '@/lib/worldTiles';
import { midCycleWidth, midOriginForTile, midTileAtX } from '@/lib/worldTileGeometry';
import { COACHELLA_STAGE_HALF, COACHELLA_STAGE_MID_X } from '@/components/game/city/sandiego/constants';
import { EDC_STAGE_HALF, EDC_STAGE_MID_X } from '@/components/game/city/lasvegas/constants';
import { WHICH_STAGE_HALF, WHICH_STAGE_MID_X } from '@/components/game/city/tentaroo/constants';
import type { StageChannel } from '@/lib/stageVideos';

/** Mid-layer venues — one type per tile, revealed as you scroll past the screen edge. */

export const MID_TILE = 2600;

/** Mid-layer viewport width (matches SFCity SVG viewBox). */
export const VIEW_WIDTH = 1400;

export const VIEW_CENTER_X = 700;

/** Matches SFCity mid-layer parallax factor. */
export const MID_PARALLAX = 0.35;

/** Default anchors — concert west, cinema far east (same tile, separated). */
export const DEFAULT_CINEMA_MID_X = 2350;

/** Default west anchor for odd tiles (concert). */
export const DEFAULT_CONCERT_MID_X = 880;

/** Coachella main-stage LED wall center (fixed on coachella tiles). */
export const DEFAULT_COACHELLA_MID_X = COACHELLA_STAGE_MID_X;

/** Sidewalk sign posts (mid-layer x, same on every block). */
export const CONCERT_SIGN_MID_X = 520;
export const CINEMA_SIGN_MID_X = 2280;

/** West / east placement bands inside a tile (keeps venues separated). */
const CONCERT_X_MIN = 520;
const CONCERT_X_MAX = 920;
const CINEMA_X_MIN = 2180;
const CINEMA_X_MAX = 2520;

/** Deterministic 0..1 jitter per tile (stable across sessions). */
function tileRand(tile: number, salt: string) {
  let h = tile * 2654435761;
  for (let i = 0; i < salt.length; i++) h = Math.imul(h ^ salt.charCodeAt(i), 2246822519);
  return ((h >>> 0) % 10000) / 10000;
}

/** @deprecated Use isSanFranciscoTile — kept for older callers. */
export function isEvenTile(tile: number) {
  return isSanFranciscoTile(tile);
}

export type VenueKind = 'cinema' | 'concert' | 'coachella' | 'edc' | 'which-stage';

export function tileKind(tile: number): VenueKind {
  if (isSanFranciscoTile(tile)) return 'cinema';
  if (isCoachellaTile(tile)) return 'coachella';
  if (isVegasTile(tile)) return 'edc';
  if (isTentarooTile(tile)) return 'which-stage';
  return 'concert';
}

/** Per-tile cinema x (San Francisco tiles only). */
export function cinemaMidX(tile: number): number | null {
  if (!isSanFranciscoTile(tile)) return null;
  const t = tileRand(tile, 'cinema');
  return Math.round(CINEMA_X_MIN + t * (CINEMA_X_MAX - CINEMA_X_MIN));
}

/**
 * Per-tile concert-stage x. Every stage city (Seattle + San Francisco) hosts a
 * concert stage on the WEST band, clear of San Francisco's east-band cinema.
 */
export function concertMidX(tile: number): number | null {
  if (isSeattleTile(tile)) {
    const t = tileRand(tile, 'concert');
    return Math.round(CONCERT_X_MIN + t * (CONCERT_X_MAX - CONCERT_X_MIN));
  }
  if (isSanFranciscoTile(tile)) {
    const t = tileRand(tile, 'sfstage');
    return Math.round(CONCERT_X_MIN + t * (CONCERT_X_MAX - CONCERT_X_MIN));
  }
  return null;
}

/** Unique festival name for each city's concert stage. */
export function concertLabel(tile: number): string | null {
  if (isSeattleTile(tile)) return 'Seattle';
  if (isSanFranciscoTile(tile)) return 'San Francisco';
  return null;
}

/** Synchronized playback channel for a venue kind (+ tile for concert cities). */
export function stageChannelForVenueKind(kind: VenueKind, tile: number): StageChannel {
  switch (kind) {
    case 'cinema':
      return 'cinema';
    case 'concert':
      return concertChannel(tile);
    case 'coachella':
      return 'coachella';
    case 'edc':
      return 'edc';
    case 'which-stage':
      return 'which-stage';
  }
}

/** Synchronized playback channel (pinned playlist) for each city's stage. */
export function concertChannel(tile: number): StageChannel {
  if (isSeattleTile(tile)) return 'bumbershoot';
  // SF tiles and any future stage city default to outside-lands.
  return 'outside-lands';
}

/** Coachella stage x (Coachella tiles only). */
export function coachellaMidX(tile: number): number | null {
  if (!isCoachellaTile(tile)) return null;
  return DEFAULT_COACHELLA_MID_X;
}

/** EDC stage x (Las Vegas tiles only). */
export function edcMidX(tile: number): number | null {
  if (!isVegasTile(tile)) return null;
  return EDC_STAGE_MID_X;
}

/** Which Stage x (Tentaroo tiles only). */
export function whichStageMidX(tile: number): number | null {
  if (!isTentarooTile(tile)) return null;
  return WHICH_STAGE_MID_X;
}

export function midVxFromWorldOff(worldOff: number) {
  return worldOff * MID_PARALLAX;
}

function venueWorldX(tile: number, midX: number) {
  return midOriginForTile(tile) + midX;
}

function viewportCenterTile(vx: number) {
  return midTileAtX(vx + VIEW_CENTER_X);
}

/** Tile whose cinema anchor is nearest the viewport center. */
export function cinemaLiveTile(vx: number) {
  return nearestTileOfKind(viewportCenterTile(vx), 'sf');
}

/** Tile whose concert stage is nearest the viewport center (SF or Seattle). */
export function concertLiveTile(vx: number) {
  return nearestStageCityTile(viewportCenterTile(vx));
}

/** Tile whose Coachella stage is nearest the viewport center. */
export function coachellaLiveTile(vx: number) {
  return nearestTileOfKind(viewportCenterTile(vx), 'coachella');
}

/** Tile whose EDC stage is nearest the viewport center. */
export function edcLiveTile(vx: number) {
  return nearestTileOfKind(viewportCenterTile(vx), 'vegas');
}

/** Tile whose Which Stage is nearest the viewport center. */
export function whichStageLiveTile(vx: number) {
  return nearestTileOfKind(viewportCenterTile(vx), 'tentaroo');
}

/** Which venue the viewport center is closer to (uses per-tile anchors). */
export function venueInFocus(vx: number): VenueKind {
  const center = vx + VIEW_CENTER_X;
  const ct = concertLiveTile(vx);
  const mt = cinemaLiveTile(vx);
  const lt = coachellaLiveTile(vx);
  const et = edcLiveTile(vx);
  const wt = whichStageLiveTile(vx);
  const cx = concertMidX(ct);
  const mx = cinemaMidX(mt);
  const lx = coachellaMidX(lt);
  const ex = edcMidX(et);
  const wx = whichStageMidX(wt);
  const concertDist = cx != null ? Math.abs(center - venueWorldX(ct, cx)) : Infinity;
  const cinemaDist = mx != null ? Math.abs(center - venueWorldX(mt, mx)) : Infinity;
  const coachellaDist = lx != null ? Math.abs(center - venueWorldX(lt, lx)) : Infinity;
  const edcDist = ex != null ? Math.abs(center - venueWorldX(et, ex)) : Infinity;
  const whichDist = wx != null ? Math.abs(center - venueWorldX(wt, wx)) : Infinity;
  const min = Math.min(cinemaDist, concertDist, coachellaDist, edcDist, whichDist);
  if (min === cinemaDist) return 'cinema';
  if (min === coachellaDist) return 'coachella';
  if (min === edcDist) return 'edc';
  if (min === whichDist) return 'which-stage';
  return 'concert';
}

/** True when the venue footprint intersects the viewport — slides in from the edge. */
export function isVenueInView(
  vx: number,
  tile: number,
  midX: number,
  halfWidth: number,
) {
  const worldX = venueWorldX(tile, midX);
  return worldX + halfWidth > vx && worldX - halfWidth < vx + VIEW_WIDTH;
}

/** True if any venue on nearby tiles intersects this viewport. */
export function anyVenueInView(
  vx: number,
  cinemaHalf: number,
  concertHalf: number,
  coachellaHalf = COACHELLA_STAGE_HALF,
  edcHalf = EDC_STAGE_HALF,
  whichHalf = WHICH_STAGE_HALF,
) {
  const centerTile = viewportCenterTile(vx);
  for (let t = centerTile - 1; t <= centerTile + 1; t++) {
    const mx = cinemaMidX(t);
    if (mx != null && isVenueInView(vx, t, mx, cinemaHalf)) return true;
    const cx = concertMidX(t);
    if (cx != null && isVenueInView(vx, t, cx, concertHalf)) return true;
    const lx = coachellaMidX(t);
    if (lx != null && isVenueInView(vx, t, lx, coachellaHalf)) return true;
    const ex = edcMidX(t);
    if (ex != null && isVenueInView(vx, t, ex, edcHalf)) return true;
    const wx = whichStageMidX(t);
    if (wx != null && isVenueInView(vx, t, wx, whichHalf)) return true;
  }
  return false;
}

/**
 * worldOff on first paint — downtown street, no venue footprint in view.
 * (Even tiles = cinema east; odd tiles = concert west.)
 */
export function initialWorldOff(
  cinemaHalf: number,
  concertHalf: number,
  coachellaHalf = COACHELLA_STAGE_HALF,
  edcHalf = EDC_STAGE_HALF,
  whichHalf = WHICH_STAGE_HALF,
) {
  for (let vx = 0; vx >= -midCycleWidth(); vx -= 40) {
    if (!anyVenueInView(vx, cinemaHalf, concertHalf, coachellaHalf, edcHalf, whichHalf)) {
      return vx / MID_PARALLAX;
    }
  }
  return 0;
}

export const START_WORLD_OFF = initialWorldOff(220, 320, COACHELLA_STAGE_HALF, EDC_STAGE_HALF, WHICH_STAGE_HALF);

export function isConcertTileInView(vx: number) {
  return concertLiveTile(vx) === viewportCenterTile(vx);
}

/** Approximate venue footprint halves for the "any stage visible" check. */
const CINEMA_VIEW_HALF = 240;
const CONCERT_VIEW_HALF = 320;

/**
 * True when ANY stage/venue footprint is currently on screen (not just the
 * focused one). Used to mute off-screen YouTube players.
 */
export function anyStageInView(worldOff: number): boolean {
  const vx = worldOff * MID_PARALLAX;
  return anyVenueInView(vx, CINEMA_VIEW_HALF, CONCERT_VIEW_HALF, COACHELLA_STAGE_HALF, EDC_STAGE_HALF, WHICH_STAGE_HALF);
}

/** True when this channel's stage footprint intersects the viewport. */
export function isStageChannelInView(channel: StageChannel, worldOff: number): boolean {
  const vx = worldOff * MID_PARALLAX;
  const centerTile = viewportCenterTile(vx);

  for (let t = centerTile - 1; t <= centerTile + 1; t++) {
    if (channel === 'cinema') {
      const mx = cinemaMidX(t);
      if (mx != null && isVenueInView(vx, t, mx, CINEMA_VIEW_HALF)) return true;
      continue;
    }
    if (channel === 'coachella') {
      const lx = coachellaMidX(t);
      if (lx != null && isVenueInView(vx, t, lx, COACHELLA_STAGE_HALF)) return true;
      continue;
    }
    if (channel === 'edc') {
      const ex = edcMidX(t);
      if (ex != null && isVenueInView(vx, t, ex, EDC_STAGE_HALF)) return true;
      continue;
    }
    if (channel === 'which-stage') {
      const wx = whichStageMidX(t);
      if (wx != null && isVenueInView(vx, t, wx, WHICH_STAGE_HALF)) return true;
      continue;
    }
    // outside-lands + bumbershoot share the concert footprint
    const cx = concertMidX(t);
    if (cx != null && isVenueInView(vx, t, cx, CONCERT_VIEW_HALF)) return true;
  }
  return false;
}

/** @deprecated use DEFAULT_CINEMA_MID_X */
export const CINEMA_MID_X = DEFAULT_CINEMA_MID_X;

/** @deprecated use DEFAULT_CONCERT_MID_X */
export const CONCERT_MID_X = DEFAULT_CONCERT_MID_X;
