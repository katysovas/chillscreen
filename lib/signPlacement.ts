import { COACHELLA_STAGE_HALF, COACHELLA_STAGE_MID_X } from '@/components/game/city/sandiego/constants';
import { EDC_STAGE_HALF, EDC_STAGE_MID_X } from '@/components/game/city/lasvegas/constants';
import { WHICH_STAGE_HALF, WHICH_STAGE_MID_X } from '@/components/game/city/tentaroo/constants';
import { FOREST_STAGE_HALF, FOREST_STAGE_MID_X } from '@/components/game/city/forest/constants';
import { SILENT_DISCO_STAGE_HALF, SILENT_DISCO_STAGE_MID_X } from '@/components/game/city/silent-disco/constants';
import { GND_F, MID_F } from '@/lib/parallax';
import { cityTileIndex } from '@/lib/spawn';
import { skipGroundStreetProp } from '@/lib/stageTreeExclusion';
import { cinemaMidX, concertMidX } from '@/lib/venues';
import { WORLD_TILE_CYCLE } from '@/lib/worldTiles';
import { gndOriginForTile, gndTileAtX, gndWidthForTile, midOriginForTile } from '@/lib/worldTileGeometry';

const SIGN_EDGE_MARGIN = 80;
const NUDGE_STEP = 40;
/** Combined junction post + both arrow wings. */
const COMBINED_SIGN_HALF_W = 170;
const STAGE_CLEARANCE = 48;

type StageAnchor = {
  tileIndex: number;
  midX: number;
  half: number;
};

const CINEMA_HALF = 240;
const CONCERT_HALF = 320;

function stageAnchorsForCycle(cycle: number): StageAnchor[] {
  const base = cycle * WORLD_TILE_CYCLE;
  const sf = base + cityTileIndex('sf');
  const vegas = base + cityTileIndex('vegas');
  const socal = base + cityTileIndex('san_diego');
  const tentaroo = base + cityTileIndex('tentaroo');
  const forest = base + cityTileIndex('forest');
  const silentDisco = base + cityTileIndex('silent_disco');
  const seattle = base + cityTileIndex('seattle');

  const anchors: StageAnchor[] = [];

  const sfConcert = concertMidX(sf);
  const sfCinema = cinemaMidX(sf);
  if (sfConcert != null) anchors.push({ tileIndex: sf, midX: sfConcert, half: CONCERT_HALF });
  if (sfCinema != null) anchors.push({ tileIndex: sf, midX: sfCinema, half: CINEMA_HALF });

  anchors.push({ tileIndex: vegas, midX: EDC_STAGE_MID_X, half: EDC_STAGE_HALF });
  anchors.push({ tileIndex: socal, midX: COACHELLA_STAGE_MID_X, half: COACHELLA_STAGE_HALF });
  anchors.push({ tileIndex: tentaroo, midX: WHICH_STAGE_MID_X, half: WHICH_STAGE_HALF });
  anchors.push({ tileIndex: forest, midX: FOREST_STAGE_MID_X, half: FOREST_STAGE_HALF });
  anchors.push({ tileIndex: silentDisco, midX: SILENT_DISCO_STAGE_MID_X, half: SILENT_DISCO_STAGE_HALF });

  const seaConcert = concertMidX(seattle);
  if (seaConcert != null) anchors.push({ tileIndex: seattle, midX: seaConcert, half: CONCERT_HALF });

  return anchors;
}

function signBlockedOnTile(tileIndex: number, localX: number, tileWidth: number): boolean {
  if (localX < SIGN_EDGE_MARGIN || localX > tileWidth - SIGN_EDGE_MARGIN) return true;
  return skipGroundStreetProp(tileIndex, localX, tileWidth);
}

/**
 * Ground signs scroll at GND_F while stages scroll at MID_F — the same absolute
 * ground x can land on top of a stage on screen. Hide the sign while overlapping.
 */
export function signParallaxOverlapsStage(
  signTileIndex: number,
  signLocalX: number,
  worldOff: number,
): boolean {
  const signWorldX = gndOriginForTile(signTileIndex) + signLocalX;
  const signScreenCenter = signWorldX - worldOff * GND_F;

  const signCycle = Math.floor(signTileIndex / WORLD_TILE_CYCLE);
  for (let dc = -1; dc <= 1; dc++) {
    const cycle = signCycle + dc;
    if (cycle < 0) continue;

    for (const stage of stageAnchorsForCycle(cycle)) {
      const stageMidWorld = midOriginForTile(stage.tileIndex) + stage.midX;
      const stageScreenCenter = stageMidWorld - worldOff * MID_F;
      const clearance = stage.half + COMBINED_SIGN_HALF_W + STAGE_CLEARANCE;
      if (Math.abs(signScreenCenter - stageScreenCenter) < clearance) {
        return true;
      }
    }
  }

  return false;
}

/** Tile-local ground x for a sign post — nudged off stage footprint bands. */
export function resolveSignGroundLocalX(
  tileIndex: number,
  preferredLocalX: number,
  tileWidth: number,
): number {
  const preferred = Math.round(preferredLocalX);
  if (!signBlockedOnTile(tileIndex, preferred, tileWidth)) return preferred;

  for (let delta = NUDGE_STEP; delta <= tileWidth / 2; delta += NUDGE_STEP) {
    for (const candidate of [preferred + delta, preferred - delta]) {
      const x = Math.round(candidate);
      if (!signBlockedOnTile(tileIndex, x, tileWidth)) return x;
    }
  }

  return preferred;
}

/** Absolute ground-layer x — nudged off stage footprints on whichever tile it sits on. */
export function resolveSignWorldGroundX(preferredWorldX: number): number {
  const preferred = Math.round(preferredWorldX);
  const tile = gndTileAtX(preferred);
  const local = preferred - gndOriginForTile(tile);
  const width = gndWidthForTile(tile);
  if (!signBlockedOnTile(tile, local, width)) return preferred;

  for (let delta = NUDGE_STEP; delta <= width * 2; delta += NUDGE_STEP) {
    for (const candidate of [preferred + delta, preferred - delta]) {
      const x = Math.round(candidate);
      const t = gndTileAtX(x);
      const lx = x - gndOriginForTile(t);
      const w = gndWidthForTile(t);
      if (!signBlockedOnTile(t, lx, w)) return x;
    }
  }

  return preferred;
}

/** Hide a ground sign at absolute world x when parallax puts it over any stage. */
export function worldSignParallaxOverlapsStage(signWorldX: number, worldOff: number): boolean {
  const tile = gndTileAtX(signWorldX);
  const local = signWorldX - gndOriginForTile(tile);
  return signParallaxOverlapsStage(tile, local, worldOff);
}
