import { COACHELLA_STAGE_HALF } from '@/components/game/city/sandiego/constants';
import { EDC_STAGE_HALF } from '@/components/game/city/lasvegas/constants';
import { FOREST_STAGE_HALF } from '@/components/game/city/forest/constants';
import { SILENT_DISCO_STAGE_HALF } from '@/components/game/city/silent-disco/constants';
import { WHICH_STAGE_HALF } from '@/components/game/city/tentaroo/constants';
import { groundWorldXAtVenue } from '@/lib/concertDance';
import { cityTileForRoute, stageWorldOffForRoute } from '@/lib/isolatedCity';
import {
  CINEMA_SCALE,
  CINEMA_WIDTH,
  CONCERT_SCALE,
  CONCERT_WIDTH,
  DEEP_SPACE_SCALE,
  DEEP_SPACE_WIDTH,
} from '@/lib/stageVideoLayout';
import type { VenueRoute } from '@/lib/venueSlugs';
import { parseVenueSlug } from '@/lib/venueSlugs';
import {
  cinemaMidX,
  coachellaMidX,
  concertMidX,
  deepSpaceMidX,
  edcMidX,
  forestStageMidX,
  silentDiscoStageMidX,
  whichStageMidX,
} from '@/lib/venues';
import { midOriginForTile } from '@/lib/worldTileGeometry';

/** Easel sits just downstage of the main screen edge (mid-layer px). */
const SIDE_GAP_MID = 36;

function midXForRoute(route: VenueRoute, tile: number): number | null {
  switch (route) {
    case 'cinema':
      return cinemaMidX(tile);
    case 'deep-space':
      return deepSpaceMidX(tile);
    case 'outside-hands':
    case 'seattle-concerts':
      return concertMidX(tile);
    case 'coachella':
      return coachellaMidX(tile);
    case 'edc':
      return edcMidX(tile);
    case 'tentaroo':
      return whichStageMidX(tile);
    case 'forest':
      return forestStageMidX(tile);
    case 'silent-disco':
      return silentDiscoStageMidX(tile);
  }
}

function stageEdgeHalfMid(route: VenueRoute): number {
  switch (route) {
    case 'cinema':
      return (CINEMA_WIDTH * CINEMA_SCALE) / 2 + SIDE_GAP_MID;
    case 'deep-space':
      return (DEEP_SPACE_WIDTH * DEEP_SPACE_SCALE) / 2 + SIDE_GAP_MID;
    case 'outside-hands':
    case 'seattle-concerts':
      return Math.ceil(Math.round(CONCERT_WIDTH * CONCERT_SCALE) / 2) + 24 + SIDE_GAP_MID;
    case 'coachella':
      return COACHELLA_STAGE_HALF + SIDE_GAP_MID;
    case 'edc':
      return EDC_STAGE_HALF + SIDE_GAP_MID;
    case 'tentaroo':
      return WHICH_STAGE_HALF + SIDE_GAP_MID;
    case 'forest':
      return FOREST_STAGE_HALF + SIDE_GAP_MID;
    case 'silent-disco':
      return SILENT_DISCO_STAGE_HALF + SIDE_GAP_MID;
  }
}

/** Ground worldX beside the main stage screen — one easel per stage. */
export function easelMidAnchorWorldX(
  stageSlug: string,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200,
): number {
  const route = parseVenueSlug(stageSlug);
  if (!route) throw new Error(`unknown easel stage slug: ${stageSlug}`);
  const tile = cityTileForRoute(route);
  const midX = midXForRoute(route, tile);
  if (midX == null) throw new Error(`easel mid anchor missing for ${route}`);
  const midWorld = midOriginForTile(tile) + midX + stageEdgeHalfMid(route);
  return groundWorldXAtVenue(stageWorldOffForRoute(route), midWorld, 0, viewportWidth);
}
