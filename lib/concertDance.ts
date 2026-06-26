import { cityTileIndex } from '@/lib/spawn';
import {
  cinemaLiveTile,
  cinemaMidX,
  coachellaLiveTile,
  coachellaMidX,
  deepSpaceMidX,
  DEEP_SPACE_MID_X,
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
  VIEW_CENTER_X,
  VIEW_WIDTH,
} from './venues';
import { midOriginForTile } from './worldTileGeometry';
import { isSouthernCaliforniaTile } from '@/lib/worldTiles';
import type { VenueRoute } from '@/lib/venueSlugs';
import { CINEMA_STATIC_MID_X } from '@/components/game/city/sf/constants';
import { EDC_STAGE_HALF, EDC_STATIC_STAGE_HALF, EDC_STATIC_STAGE_MID_X } from '@/components/game/city/lasvegas/constants';
import { COACHELLA_STAGE_HALF, COACHELLA_STATIC_STAGE_HALF, COACHELLA_STATIC_STAGE_MID_X } from '@/components/game/city/sandiego/constants';
import { WHICH_STAGE_HALF } from '@/components/game/city/tentaroo/constants';
import { FOREST_STAGE_HALF } from '@/components/game/city/forest/constants';
import { SILENT_DISCO_STAGE_HALF } from '@/components/game/city/silent-disco/constants';
import { CINEMA_SCALE, CINEMA_WIDTH } from '@/components/game/Cinema';
import { CONCERT_SCALE, CONCERT_WIDTH } from '@/components/game/Concert';
import { DEEP_SPACE_SCALE, DEEP_SPACE_WIDTH } from '@/lib/stageVideoLayout';

/** Screen-% distance from a stage/cinema to start dancing. */
export const STAGE_DANCE_RADIUS_PCT = 24;

/** @deprecated use STAGE_DANCE_RADIUS_PCT */
export const CONCERT_DANCE_RADIUS_PCT = STAGE_DANCE_RADIUS_PCT;

const CINEMA_HALF_MID = Math.ceil(Math.round(CINEMA_WIDTH * CINEMA_SCALE) / 2) + 24;
const CONCERT_HALF_MID = Math.ceil(Math.round(CONCERT_WIDTH * CONCERT_SCALE) / 2) + 24;
const DEEP_SPACE_HALF_MID = Math.ceil(Math.round(DEEP_SPACE_WIDTH * DEEP_SPACE_SCALE) / 2) + 24;

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
  const primary = liveVenueMidWorldX(worldOff, cinemaLiveTile, cinemaMidX, CINEMA_HALF_MID);
  if (primary != null) return primary;
  const vx = midVxFromWorldOff(worldOff);
  const tile = cityTileIndex('sf');
  if (cinemaLiveTile(vx) !== tile) return null;
  if (!isVenueInView(vx, tile, CINEMA_STATIC_MID_X, CINEMA_HALF_MID)) return null;
  return midOriginForTile(tile) + CINEMA_STATIC_MID_X;
}

export function liveConcertMidWorldX(worldOff: number): number | null {
  return liveVenueMidWorldX(worldOff, concertLiveTile, concertMidX, CONCERT_HALF_MID);
}

export function liveCoachellaMidWorldX(worldOff: number): number | null {
  const primary = liveVenueMidWorldX(worldOff, coachellaLiveTile, coachellaMidX, COACHELLA_STAGE_HALF);
  if (primary != null) return primary;
  const vx = midVxFromWorldOff(worldOff);
  const tile = cityTileIndex('san_diego');
  if (!isSouthernCaliforniaTile(tile)) return null;
  if (!isVenueInView(vx, tile, COACHELLA_STATIC_STAGE_MID_X, COACHELLA_STATIC_STAGE_HALF)) return null;
  return midOriginForTile(tile) + COACHELLA_STATIC_STAGE_MID_X;
}

export function liveEdcMidWorldX(worldOff: number): number | null {
  const primary = liveVenueMidWorldX(worldOff, edcLiveTile, edcMidX, EDC_STAGE_HALF);
  if (primary != null) return primary;
  const vx = midVxFromWorldOff(worldOff);
  const tile = cityTileIndex('vegas');
  if (edcLiveTile(vx) !== tile) return null;
  if (!isVenueInView(vx, tile, EDC_STATIC_STAGE_MID_X, EDC_STATIC_STAGE_HALF)) return null;
  return midOriginForTile(tile) + EDC_STATIC_STAGE_MID_X;
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

export function liveDeepSpaceMidWorldX(worldOff: number): number | null {
  const primary = liveVenueMidWorldX(worldOff, cinemaLiveTile, deepSpaceMidX, DEEP_SPACE_HALF_MID);
  if (primary != null) return primary;
  const vx = midVxFromWorldOff(worldOff);
  const tile = cityTileIndex('sf');
  if (cinemaLiveTile(vx) !== tile) return null;
  if (!isVenueInView(vx, tile, DEEP_SPACE_MID_X, DEEP_SPACE_HALF_MID)) return null;
  return midOriginForTile(tile) + DEEP_SPACE_MID_X;
}

type LiveStageMidFn = (worldOff: number) => number | null;

/** Isolated venue routes — only match the active stage (avoids SF tile cross-talk). */
const ROUTE_STAGE_MID: Partial<Record<VenueRoute, LiveStageMidFn>> = {
  'deep-space': liveDeepSpaceMidWorldX,
  cinema: liveCinemaMidWorldX,
  'outside-hands': liveConcertMidWorldX,
  'seattle-concerts': liveConcertMidWorldX,
  coachella: liveCoachellaMidWorldX,
  edc: liveEdcMidWorldX,
  tentaroo: liveWhichStageMidWorldX,
  'creator-chill': liveWhichStageMidWorldX,
  'creator-cinema': liveWhichStageMidWorldX,
  hula: liveWhichStageMidWorldX,
  headliner: liveWhichStageMidWorldX,
  forest: liveForestStageMidWorldX,
  'silent-disco': liveSilentDiscoMidWorldX,
};

const ALL_STAGE_MIDS: LiveStageMidFn[] = [
  liveDeepSpaceMidWorldX,
  liveCinemaMidWorldX,
  liveConcertMidWorldX,
  liveCoachellaMidWorldX,
  liveEdcMidWorldX,
  liveWhichStageMidWorldX,
  liveForestStageMidWorldX,
  liveSilentDiscoMidWorldX,
];

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

/** True when entity is within dance range of an on-screen stage. */
export function isNearStage(
  entityWorldX: number,
  worldOff: number,
  width: number,
  radiusPct = STAGE_DANCE_RADIUS_PCT,
  route?: VenueRoute | null,
): boolean {
  const scoped = route ? ROUTE_STAGE_MID[route] : null;
  const mids = scoped ? [scoped] : ALL_STAGE_MIDS;
  return mids.some(midFn =>
    isNearVenue(entityWorldX, worldOff, width, midFn(worldOff), radiusPct),
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
