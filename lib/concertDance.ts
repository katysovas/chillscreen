import {
  MID_TILE,
  VIEW_CENTER_X,
  VIEW_WIDTH,
  cinemaLiveTile,
  cinemaMidX,
  coachellaLiveTile,
  coachellaMidX,
  edcLiveTile,
  edcMidX,
  forestLiveTile,
  forestStageMidX,
  silentDiscoLiveTile,
  silentDiscoStageMidX,
  whichStageLiveTile,
  whichStageMidX,
  concertLiveTile,
  concertMidX,
  isVenueInView,
  midVxFromWorldOff,
} from './venues';
import { midOriginForTile } from './worldTileGeometry';
import { COACHELLA_STAGE_HALF } from '@/components/game/city/sandiego/constants';
import { EDC_STAGE_HALF } from '@/components/game/city/lasvegas/constants';
import { WHICH_STAGE_HALF } from '@/components/game/city/tentaroo/constants';
import { FOREST_STAGE_HALF } from '@/components/game/city/forest/constants';
import { SILENT_DISCO_STAGE_HALF } from '@/components/game/city/silent-disco/constants';
import { CINEMA_SCALE, CINEMA_WIDTH } from '@/components/game/Cinema';
import { CONCERT_SCALE, CONCERT_WIDTH } from '@/components/game/Concert';

/** Screen-% distance from a stage/cinema to start dancing. */
export const STAGE_DANCE_RADIUS_PCT = 24;

/** @deprecated use STAGE_DANCE_RADIUS_PCT */
export const CONCERT_DANCE_RADIUS_PCT = STAGE_DANCE_RADIUS_PCT;

const CINEMA_HALF_MID = Math.ceil(Math.round(CINEMA_WIDTH * CINEMA_SCALE) / 2) + 24;
const CONCERT_HALF_MID = Math.ceil(Math.round(CONCERT_WIDTH * CONCERT_SCALE) / 2) + 24;

function liveVenueMidWorldX(
  worldOff: number,
  liveTile: (vx: number) => number,
  midXFn: (tile: number) => number | null,
  half: number,
): number | null {
  const vx = midVxFromWorldOff(worldOff);
  const tile = liveTile(vx);
  const midX = midXFn(tile);
  if (midX == null) return null;
  if (!isVenueInView(vx, tile, midX, half)) return null;
  return midOriginForTile(tile) + midX;
}

export function liveCinemaMidWorldX(worldOff: number): number | null {
  return liveVenueMidWorldX(worldOff, cinemaLiveTile, cinemaMidX, CINEMA_HALF_MID);
}

export function liveConcertMidWorldX(worldOff: number): number | null {
  return liveVenueMidWorldX(worldOff, concertLiveTile, concertMidX, CONCERT_HALF_MID);
}

export function liveCoachellaMidWorldX(worldOff: number): number | null {
  return liveVenueMidWorldX(worldOff, coachellaLiveTile, coachellaMidX, COACHELLA_STAGE_HALF);
}

export function liveEdcMidWorldX(worldOff: number): number | null {
  return liveVenueMidWorldX(worldOff, edcLiveTile, edcMidX, EDC_STAGE_HALF);
}

export function liveWhichStageMidWorldX(worldOff: number): number | null {
  return liveVenueMidWorldX(worldOff, whichStageLiveTile, whichStageMidX, WHICH_STAGE_HALF);
}

export function liveForestStageMidWorldX(worldOff: number): number | null {
  return liveVenueMidWorldX(worldOff, forestLiveTile, forestStageMidX, FOREST_STAGE_HALF);
}

export function liveSilentDiscoMidWorldX(worldOff: number): number | null {
  return liveVenueMidWorldX(worldOff, silentDiscoLiveTile, silentDiscoStageMidX, SILENT_DISCO_STAGE_HALF);
}

export function entityScreenPct(worldX: number, worldOff: number, width: number) {
  return 50 + ((worldX - worldOff) / width) * 100;
}

export function venueScreenPct(worldOff: number, midWorldX: number) {
  const vx = midVxFromWorldOff(worldOff);
  return 50 + ((midWorldX - vx - VIEW_CENTER_X) / VIEW_WIDTH) * 100;
}

/** Ground scroll x for a point at a venue's screen % (matches player/NPC space). */
export function groundWorldXAtVenueScreenPct(
  worldOff: number,
  screenPct: number,
  width = typeof window !== 'undefined' ? window.innerWidth : 1200,
): number {
  return worldOff + ((screenPct - 50) / 100) * width;
}

/** Ground scroll x in the crowd lane just downstage of a venue mid anchor. */
export function groundWorldXAtVenue(
  worldOff: number,
  midWorldX: number,
  screenOffsetPct = 0,
  width = typeof window !== 'undefined' ? window.innerWidth : 1200,
): number {
  return groundWorldXAtVenueScreenPct(
    worldOff,
    venueScreenPct(worldOff, midWorldX) + screenOffsetPct,
    width,
  );
}

/** @deprecated use venueScreenPct */
export const concertScreenPct = venueScreenPct;

function isNearVenue(
  entityWorldX: number,
  worldOff: number,
  width: number,
  midWorldX: number | null,
  radiusPct: number,
): boolean {
  if (midWorldX == null) return false;
  const entityPct = entityScreenPct(entityWorldX, worldOff, width);
  const stagePct = venueScreenPct(worldOff, midWorldX);
  return Math.abs(entityPct - stagePct) < radiusPct;
}

/** True when entity is within dance range of any on-screen stage (cinema, concert, Coachella). */
export function isNearStage(
  entityWorldX: number,
  worldOff: number,
  width: number,
  radiusPct = STAGE_DANCE_RADIUS_PCT,
): boolean {
  return (
    isNearVenue(entityWorldX, worldOff, width, liveCinemaMidWorldX(worldOff), radiusPct) ||
    isNearVenue(entityWorldX, worldOff, width, liveConcertMidWorldX(worldOff), radiusPct) ||
    isNearVenue(entityWorldX, worldOff, width, liveCoachellaMidWorldX(worldOff), radiusPct) ||
    isNearVenue(entityWorldX, worldOff, width, liveEdcMidWorldX(worldOff), radiusPct) ||
    isNearVenue(entityWorldX, worldOff, width, liveWhichStageMidWorldX(worldOff), radiusPct) ||
    isNearVenue(entityWorldX, worldOff, width, liveForestStageMidWorldX(worldOff), radiusPct) ||
    isNearVenue(entityWorldX, worldOff, width, liveSilentDiscoMidWorldX(worldOff), radiusPct)
  );
}

/** @deprecated use isNearStage */
export function isNearConcert(
  entityWorldX: number,
  worldOff: number,
  width: number,
  radiusPct = STAGE_DANCE_RADIUS_PCT,
): boolean {
  return isNearStage(entityWorldX, worldOff, width, radiusPct);
}
