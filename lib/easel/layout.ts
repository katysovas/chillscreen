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

/** Gap between festie body and easel frame (screen px = world units). */
export const EASEL_NPC_STAND_GAP = 4;
/** Festie body width at default scale — stand uses left edge of sprite. */
export const EASEL_NPC_BODY_PX = 48;

/** Left edge of the easel art unit (frame), centered on canvasWorldX. */
export function easelFrameLeftWorldX(canvasWorldX: number): number {
  return canvasWorldX - EASEL_DISPLAY_WIDTH / 2;
}

/** Ground world-x for the painter's left edge — just left of the canvas frame. */
export function easelNpcStandWorldXForCanvas(canvasWorldX: number): number {
  return easelFrameLeftWorldX(canvasWorldX) - EASEL_NPC_STAND_GAP - EASEL_NPC_BODY_PX;
}

/** NPC stand position — left of canvas, close, facing right toward the easel. */
export function easelNpcStandWorldX(slot: number, stageSlug?: string, width?: number): number {
  const slug = stageSlug ?? venueSlugForRoute('cinema');
  return easelNpcStandWorldXForCanvas(easelSlotWorldX(slot, slug, width));
}

export function easelSlotsForStage(stageSlug: string): number[] {
  void stageSlug;
  return Array.from({ length: EASEL_SLOTS_PER_STAGE }, (_, i) => i);
}

export function stageSlugForVenueRoute(route: string): string {
  return venueSlugForRoute(route as import('@/lib/venueSlugs').VenueRoute);
}
