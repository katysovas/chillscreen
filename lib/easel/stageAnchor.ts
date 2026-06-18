import { groundWorldXAtVenueScreenPct } from '@/lib/concertDance';
import { stageWorldOffForRoute } from '@/lib/isolatedCity';
import type { VenueRoute } from '@/lib/venueSlugs';
import { parseVenueSlug } from '@/lib/venueSlugs';
import { EASEL_SLOTS_PER_STAGE } from './types';

/**
 * Screen-% positions for easel slots — venue wings and sidewalks, not downstage
 * of the main screen where the crowd gathers.
 */
export const EASEL_SLOT_SCREEN_PCT = [15, 85, 24, 76] as const;

export function easelSlotScreenPct(slot: number): number {
  const n = EASEL_SLOT_SCREEN_PCT.length;
  const idx = ((slot % n) + n) % n;
  return EASEL_SLOT_SCREEN_PCT[idx]!;
}

/** Next slot index when rotating painters after a finished canvas. */
export function nextEaselSlot(afterSlot: number): number {
  return (afterSlot + 1) % EASEL_SLOTS_PER_STAGE;
}

/** Resolve venue layout — built-in slugs parse; creator `/watch/{slug}` uses fallback route. */
export function easelLayoutRouteForSlug(
  stageSlug: string,
  layoutRoute?: VenueRoute,
): VenueRoute {
  return parseVenueSlug(stageSlug) ?? layoutRoute ?? (() => {
    throw new Error(`unknown easel stage slug: ${stageSlug}`);
  })();
}

/** Fixed ground worldX for an easel slot at the stage-centered scroll position. */
export function easelSlotAnchorWorldX(
  slot: number,
  stageSlug: string,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200,
  layoutRoute?: VenueRoute,
): number {
  const route = easelLayoutRouteForSlug(stageSlug, layoutRoute);
  return easelSlotAnchorWorldXForRoute(slot, route, viewportWidth);
}

/** Easel slot world-x for a live camera offset — keeps slots at fixed screen %. */
export function easelSlotAnchorWorldXForCamera(
  slot: number,
  cameraWorldOff: number,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200,
): number {
  const screenPct = easelSlotScreenPct(slot);
  return groundWorldXAtVenueScreenPct(cameraWorldOff, screenPct, viewportWidth);
}

export function easelSlotAnchorWorldXForRoute(
  slot: number,
  route: VenueRoute,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200,
): number {
  const screenPct = easelSlotScreenPct(slot);
  return groundWorldXAtVenueScreenPct(
    stageWorldOffForRoute(route),
    screenPct,
    viewportWidth,
  );
}

/** @deprecated use easelSlotAnchorWorldX(slot, stageSlug) */
export function easelMidAnchorWorldX(
  stageSlug: string,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200,
): number {
  return easelSlotAnchorWorldX(0, stageSlug, viewportWidth);
}
