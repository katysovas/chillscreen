import {
  isCoachellaTile,
  isSanFranciscoTile,
  isSeattleTile,
  nearestTileOfKind,
} from '@/lib/worldTiles';
import { midCycleWidth, midOriginForTile, midTileAtX } from '@/lib/worldTileGeometry';
import { COACHELLA_STAGE_HALF, COACHELLA_STAGE_MID_X } from '@/components/game/city/sandiego/constants';

/** Mid-layer venues — one type per tile, revealed as you scroll past the screen edge. */

export const MID_TILE = 2600;

/** Mid-layer viewport width (matches SFCity SVG viewBox). */
export const VIEW_WIDTH = 1400;

export const VIEW_CENTER_X = 700;

/** Matches SFCity mid-layer parallax factor. */
export const MID_PARALLAX = 0.35;

/** Default anchors (cinema worked well here — east side of even tiles). */
export const DEFAULT_CINEMA_MID_X = 1720;

/** Default west anchor for odd tiles (concert). */
export const DEFAULT_CONCERT_MID_X = 880;

/** Coachella main-stage LED wall center (fixed on coachella tiles). */
export const DEFAULT_COACHELLA_MID_X = COACHELLA_STAGE_MID_X;

/** Sidewalk sign posts (mid-layer x, same on every block). */
export const CONCERT_SIGN_MID_X = 520;
export const CINEMA_SIGN_MID_X = 1980;

/** West / east placement bands inside a tile (keeps venues separated). */
const CONCERT_X_MIN = 620;
const CONCERT_X_MAX = 1040;
const CINEMA_X_MIN = 1480;
const CINEMA_X_MAX = 2100;

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

export type VenueKind = 'cinema' | 'concert' | 'coachella';

export function tileKind(tile: number): VenueKind {
  if (isSanFranciscoTile(tile)) return 'cinema';
  if (isCoachellaTile(tile)) return 'coachella';
  return 'concert';
}

/** Per-tile cinema x (San Francisco tiles only). */
export function cinemaMidX(tile: number): number | null {
  if (!isSanFranciscoTile(tile)) return null;
  const t = tileRand(tile, 'cinema');
  return Math.round(CINEMA_X_MIN + t * (CINEMA_X_MAX - CINEMA_X_MIN));
}

/** Per-tile concert x (Seattle tiles only). */
export function concertMidX(tile: number): number | null {
  if (!isSeattleTile(tile)) return null;
  const t = tileRand(tile, 'concert');
  return Math.round(CONCERT_X_MIN + t * (CONCERT_X_MAX - CONCERT_X_MIN));
}

/** Coachella stage x (Coachella tiles only). */
export function coachellaMidX(tile: number): number | null {
  if (!isCoachellaTile(tile)) return null;
  return DEFAULT_COACHELLA_MID_X;
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

/** Tile whose concert anchor is nearest the viewport center. */
export function concertLiveTile(vx: number) {
  return nearestTileOfKind(viewportCenterTile(vx), 'seattle');
}

/** Tile whose Coachella stage is nearest the viewport center. */
export function coachellaLiveTile(vx: number) {
  return nearestTileOfKind(viewportCenterTile(vx), 'coachella');
}

/** Which venue the viewport center is closer to (uses per-tile anchors). */
export function venueInFocus(vx: number): VenueKind {
  const center = vx + VIEW_CENTER_X;
  const ct = concertLiveTile(vx);
  const mt = cinemaLiveTile(vx);
  const lt = coachellaLiveTile(vx);
  const cx = concertMidX(ct);
  const mx = cinemaMidX(mt);
  const lx = coachellaMidX(lt);
  const concertDist = cx != null ? Math.abs(center - venueWorldX(ct, cx)) : Infinity;
  const cinemaDist = mx != null ? Math.abs(center - venueWorldX(mt, mx)) : Infinity;
  const coachellaDist = lx != null ? Math.abs(center - venueWorldX(lt, lx)) : Infinity;
  if (cinemaDist <= concertDist && cinemaDist <= coachellaDist) return 'cinema';
  if (coachellaDist <= concertDist && coachellaDist <= cinemaDist) return 'coachella';
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
) {
  const centerTile = viewportCenterTile(vx);
  for (let t = centerTile - 1; t <= centerTile + 1; t++) {
    const mx = cinemaMidX(t);
    if (mx != null && isVenueInView(vx, t, mx, cinemaHalf)) return true;
    const cx = concertMidX(t);
    if (cx != null && isVenueInView(vx, t, cx, concertHalf)) return true;
    const lx = coachellaMidX(t);
    if (lx != null && isVenueInView(vx, t, lx, coachellaHalf)) return true;
  }
  return false;
}

/**
 * worldOff on first paint — downtown street, no venue footprint in view.
 * (Even tiles = cinema east; odd tiles = concert west.)
 */
export function initialWorldOff(cinemaHalf: number, concertHalf: number, coachellaHalf = COACHELLA_STAGE_HALF) {
  for (let vx = 0; vx >= -midCycleWidth(); vx -= 40) {
    if (!anyVenueInView(vx, cinemaHalf, concertHalf, coachellaHalf)) {
      return vx / MID_PARALLAX;
    }
  }
  return 0;
}

export const START_WORLD_OFF = initialWorldOff(220, 260, COACHELLA_STAGE_HALF);

export function isConcertTileInView(vx: number) {
  return concertLiveTile(vx) === viewportCenterTile(vx);
}

/** @deprecated use DEFAULT_CINEMA_MID_X */
export const CINEMA_MID_X = DEFAULT_CINEMA_MID_X;

/** @deprecated use DEFAULT_CONCERT_MID_X */
export const CONCERT_MID_X = DEFAULT_CONCERT_MID_X;
