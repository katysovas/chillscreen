import { cityTileForRoute, stageWorldOffForRoute } from '@/lib/isolatedCity';
import { groundWorldXAtVenue } from '@/lib/concertDance';
import { CINEMA_SCALE, CINEMA_WIDTH } from '@/lib/stageVideoLayout';
import { cinemaMidX } from '@/lib/venues';
import { midOriginForTile } from '@/lib/worldTileGeometry';
import { venueSlugForRoute } from '@/lib/venueSlugs';

export const CINEMA_EASEL_ART_SIZE = 460;
export const CINEMA_EASEL_DISPLAY_SCALE = 0.36;
export const CINEMA_EASEL_DISPLAY_WIDTH = CINEMA_EASEL_ART_SIZE * CINEMA_EASEL_DISPLAY_SCALE;
export const CINEMA_EASEL_DISPLAY_HEIGHT = CINEMA_EASEL_DISPLAY_WIDTH;

/** Drawing surface pixel size. */
export const CINEMA_CANVAS_WIDTH = 272;
export const CINEMA_CANVAS_HEIGHT = 214;

/** Canvas offset inside the easel art unit. */
export const CINEMA_EASEL_FRAME_LEFT = 94;
export const CINEMA_EASEL_FRAME_TOP = 80;

export const CINEMA_CANVAS_STAGE_SLUG = venueSlugForRoute('cinema');

/** Gap between cinema screen edge and easel in mid-layer px. */
const CINEMA_CANVAS_SIDE_GAP_MID = 36;
const CINEMA_HALF_MID = (CINEMA_WIDTH * CINEMA_SCALE) / 2;

function cinemaCanvasMidWorldX(tile: number): number | null {
  const center = cinemaMidX(tile);
  if (center == null) return null;
  return midOriginForTile(tile) + center + CINEMA_HALF_MID + CINEMA_CANVAS_SIDE_GAP_MID;
}

/**
 * Fixed ground-layer worldX beside the cinema — computed once from spawn position.
 * Behaves exactly like an NPC startX: stays at this worldX forever, visible
 * position recalculated each frame via worldXToScreenPct.
 */
export function cinemaCanvasAnchorWorldX(
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200,
): number {
  const tile = cityTileForRoute('cinema');
  const midWorld = cinemaCanvasMidWorldX(tile);
  if (midWorld == null) throw new Error('cinema canvas mid anchor missing');
  return groundWorldXAtVenue(stageWorldOffForRoute('cinema'), midWorld, 0, viewportWidth);
}
