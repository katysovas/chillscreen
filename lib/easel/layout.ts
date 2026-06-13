import { cityTileForRoute, stageWorldOffForRoute } from '@/lib/isolatedCity';
import { groundWorldXAtVenue } from '@/lib/concertDance';
import { CINEMA_SCALE, CINEMA_WIDTH } from '@/lib/stageVideoLayout';
import { cinemaMidX } from '@/lib/venues';
import { midOriginForTile } from '@/lib/worldTileGeometry';
import { venueSlugForRoute } from '@/lib/venueSlugs';
import { EASEL_SLOTS_PER_STAGE } from './types';

export const EASEL_DISPLAY_SCALE = 0.36;
export const EASEL_ART_SIZE = 460;
export const EASEL_DISPLAY_WIDTH = EASEL_ART_SIZE * EASEL_DISPLAY_SCALE;
export const EASEL_FRAME_LEFT = 94;
export const EASEL_FRAME_TOP = 80;

const CINEMA_HALF_MID = (CINEMA_WIDTH * CINEMA_SCALE) / 2;
const SIDE_GAP_MID = 36;

/** Ground-world spacing between easel slots (px). */
const SLOT_SPACING_GROUND = 130;

function cinemaMidAnchorWorldX(tile: number): number | null {
  const center = cinemaMidX(tile);
  if (center == null) return null;
  return midOriginForTile(tile) + center + CINEMA_HALF_MID + SIDE_GAP_MID;
}

function cinemaBaseGroundWorldX(
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200,
): number {
  const tile = cityTileForRoute('cinema');
  const midWorld = cinemaMidAnchorWorldX(tile);
  if (midWorld == null) throw new Error('cinema easel mid anchor missing');
  return groundWorldXAtVenue(stageWorldOffForRoute('cinema'), midWorld, 0, viewportWidth);
}

/** Fixed ground worldX for easel slot — never changes while walking. */
export function easelSlotWorldX(
  slot: number,
  stageSlug = venueSlugForRoute('cinema'),
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200,
): number {
  if (stageSlug !== venueSlugForRoute('cinema')) {
    return cinemaBaseGroundWorldX(viewportWidth) + slot * SLOT_SPACING_GROUND;
  }
  const base = cinemaBaseGroundWorldX(viewportWidth);
  if (EASEL_SLOTS_PER_STAGE <= 1) return base;
  const offset = (slot - 1) * SLOT_SPACING_GROUND;
  return base + offset;
}

/** NPC stand position — slightly left of easel, facing the canvas. */
export function easelNpcStandWorldX(slot: number, stageSlug?: string, width?: number): number {
  return easelSlotWorldX(slot, stageSlug, width) - 55;
}

export function easelSlotsForStage(stageSlug: string): number[] {
  void stageSlug;
  return Array.from({ length: EASEL_SLOTS_PER_STAGE }, (_, i) => i);
}

export function stageSlugForVenueRoute(route: string): string {
  if (route === 'cinema') return venueSlugForRoute('cinema');
  return venueSlugForRoute(route as 'cinema');
}
