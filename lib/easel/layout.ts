import {
  easelLayoutRouteForSlug,
  easelSlotAnchorWorldXForCamera,
} from './stageAnchor';
import { stageWorldOffForRoute } from '@/lib/isolatedCity';
import type { VenueRoute } from '@/lib/venueSlugs';
import { venueSlugForRoute } from '@/lib/venueSlugs';
import { EASEL_SLOTS_PER_STAGE } from './types';

export const EASEL_DISPLAY_SCALE = 0.36;
export const EASEL_ART_SIZE = 460;
export const EASEL_DISPLAY_WIDTH = EASEL_ART_SIZE * EASEL_DISPLAY_SCALE;
export const EASEL_FRAME_LEFT = 94;
export const EASEL_FRAME_TOP = 80;
export const EASEL_FRAME_LEFT_SCALED = EASEL_FRAME_LEFT * EASEL_DISPLAY_SCALE;

/** Gap between festie body and drawing canvas edge (screen px = world units). */
export const EASEL_NPC_STAND_GAP = 0;
/** Default crowd NPC scale — matches CharacterDef / NPC default. */
export const EASEL_NPC_SCALE = 0.34;
/** Character artboard width before scale. */
export const EASEL_NPC_ARTBOARD_W = 500;
/** Half-width at default scale — NPC `left` % is the sprite center (translateX(-50%)). */
export const EASEL_NPC_HALF_WIDTH_PX = (EASEL_NPC_ARTBOARD_W * EASEL_NPC_SCALE) / 2;
/** Visible reach from center toward the easel — artboard has side margins; brush/hand ends here. */
export const EASEL_NPC_STAND_REACH_PX = 56;
/** @deprecated use EASEL_NPC_HALF_WIDTH_PX */
export const EASEL_NPC_BODY_PX = EASEL_NPC_HALF_WIDTH_PX;

/** Fixed ground worldX for easel slot — uses live camera when `cameraWorldOff` is set. */
export function easelSlotWorldX(
  slot: number,
  stageSlug: string,
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200,
  layoutRoute?: VenueRoute,
  cameraWorldOff?: number,
): number {
  const route = easelLayoutRouteForSlug(stageSlug, layoutRoute);
  const off = cameraWorldOff ?? stageWorldOffForRoute(route);
  return easelSlotAnchorWorldXForCamera(slot, off, viewportWidth);
}

/** Left edge of the easel art unit (frame), centered on canvasWorldX. */
export function easelFrameLeftWorldX(canvasWorldX: number): number {
  return canvasWorldX - EASEL_DISPLAY_WIDTH / 2;
}

/** Left edge of the white drawing surface inside the easel frame. */
export function easelDrawingCanvasLeftWorldX(canvasWorldX: number): number {
  return easelFrameLeftWorldX(canvasWorldX) + EASEL_FRAME_LEFT_SCALED;
}

/** Ground world-x for the painter's center — hand at the canvas edge, facing right. */
export function easelNpcStandWorldXForCanvas(canvasWorldX: number): number {
  return easelDrawingCanvasLeftWorldX(canvasWorldX)
    - EASEL_NPC_STAND_GAP
    - EASEL_NPC_STAND_REACH_PX;
}

/** NPC stand position — left of canvas, close, facing right toward the easel. */
export function easelNpcStandWorldX(
  slot: number,
  stageSlug?: string,
  width?: number,
  layoutRoute?: VenueRoute,
  cameraWorldOff?: number,
): number {
  const slug = stageSlug ?? venueSlugForRoute('cinema');
  return easelNpcStandWorldXForCanvas(
    easelSlotWorldX(slot, slug, width, layoutRoute, cameraWorldOff),
  );
}

export function easelSlotsForStage(stageSlug: string): number[] {
  void stageSlug;
  return Array.from({ length: EASEL_SLOTS_PER_STAGE }, (_, i) => i);
}

export function stageSlugForVenueRoute(route: string): string {
  return venueSlugForRoute(route as import('@/lib/venueSlugs').VenueRoute);
}
