import {
  MOBILE_STATIC_VB_HEIGHT,
  MOBILE_VENUE_GROUND_GAP_PX,
  MOBILE_VENUE_STAGE_VB_H,
} from '@/lib/staticCityViewport';

/** Matches `calc(max(env(safe-area-inset-top, 0px), 8px) + 72px)` — conservative default. */
export const MOBILE_CONTROLS_TOP_PX = 80;

/** Screen y where the mobile grass / NPC lawn begins (below stage + gap). */
export function mobileGrassTopPx(
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 390,
): number {
  const stageStrip = (MOBILE_VENUE_STAGE_VB_H / MOBILE_STATIC_VB_HEIGHT) * viewportWidth;
  return MOBILE_CONTROLS_TOP_PX + stageStrip + MOBILE_VENUE_GROUND_GAP_PX;
}

/** Usable vertical lawn for NPC depth (px), aligned with `--mobile-char-bottom` math. */
export function mobileLawnHeightPx(
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 390,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 844,
): number {
  const grassTop = mobileGrassTopPx(viewportWidth);
  const walkLine = (8 / 900) * viewportWidth;
  return Math.max(140, viewportHeight - grassTop - walkLine);
}

/** Deep Space mobile — vertical band below the orbit stage for floating NPCs. */
export function mobileOrbitBandHeightPx(
  viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 390,
  viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 844,
): number {
  const stageStrip = (MOBILE_VENUE_STAGE_VB_H / MOBILE_STATIC_VB_HEIGHT) * viewportWidth;
  return Math.max(160, viewportHeight - MOBILE_CONTROLS_TOP_PX - stageStrip - 24);
}
