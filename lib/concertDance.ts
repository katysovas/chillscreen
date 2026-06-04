import {
  MID_TILE,
  VIEW_CENTER_X,
  VIEW_WIDTH,
  concertLiveTile,
  concertMidX,
  isVenueInView,
  midVxFromWorldOff,
} from './venues';

/** Screen-% distance from concert stage to start dancing. */
export const CONCERT_DANCE_RADIUS_PCT = 24;

/** Concert footprint half-width in mid-layer units (matches SFCity MidLayer). */
const CONCERT_HALF_MID = Math.ceil(Math.round(420 * 0.54) / 2) + 24;

export function liveConcertMidWorldX(worldOff: number): number | null {
  const vx = midVxFromWorldOff(worldOff);
  const tile = concertLiveTile(vx);
  const midX = concertMidX(tile);
  if (midX == null) return null;
  if (!isVenueInView(vx, tile, midX, CONCERT_HALF_MID)) return null;
  return tile * MID_TILE + midX;
}

export function entityScreenPct(worldX: number, worldOff: number, width: number) {
  return 50 + ((worldX - worldOff) / width) * 100;
}

export function concertScreenPct(worldOff: number, concertMidWorldX: number) {
  const vx = midVxFromWorldOff(worldOff);
  return 50 + ((concertMidWorldX - vx - VIEW_CENTER_X) / VIEW_WIDTH) * 100;
}

/** True when entity is within dance range of the live on-screen concert. */
export function isNearConcert(
  entityWorldX: number,
  worldOff: number,
  width: number,
  radiusPct = CONCERT_DANCE_RADIUS_PCT,
): boolean {
  const concertX = liveConcertMidWorldX(worldOff);
  if (concertX == null) return false;

  const entityPct = entityScreenPct(entityWorldX, worldOff, width);
  const stagePct = concertScreenPct(worldOff, concertX);
  return Math.abs(entityPct - stagePct) < radiusPct;
}
