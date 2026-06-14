import { easelSlotAnchorWorldX } from './stageAnchor';
import { venueSlugForRoute } from '@/lib/venueSlugs';
import { EASEL_SLOTS_PER_STAGE } from './types';

export const EASEL_DISPLAY_SCALE = 0.36;
export const EASEL_ART_SIZE = 460;
export const EASEL_DISPLAY_WIDTH = EASEL_ART_SIZE * EASEL_DISPLAY_SCALE;
export const EASEL_FRAME_LEFT = 94;
export const EASEL_FRAME_TOP = 80;

/** Fixed ground worldX for easel slot — never changes while walking. */
export function easelSlotWorldX(
  slot: number,
  stageSlug: string,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200,
): number {
  return easelSlotAnchorWorldX(slot, stageSlug, viewportWidth);
}

/** NPC stand position — slightly left of easel, facing the canvas. */
export function easelNpcStandWorldX(slot: number, stageSlug?: string, width?: number): number {
  const slug = stageSlug ?? venueSlugForRoute('cinema');
  return easelSlotWorldX(slot, slug, width) - 55;
}

export function easelSlotsForStage(stageSlug: string): number[] {
  void stageSlug;
  return Array.from({ length: EASEL_SLOTS_PER_STAGE }, (_, i) => i);
}

export function stageSlugForVenueRoute(route: string): string {
  return venueSlugForRoute(route as import('@/lib/venueSlugs').VenueRoute);
}
