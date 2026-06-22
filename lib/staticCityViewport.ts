import {
  TENTAROO_GND,
  WHICH_STAGE_HERO_ROW_GAP,
  WHICH_STAGE_PUSH_Y,
  WHICH_STAGE_SCALE,
  WHICH_STAGE_TRUSS_Y,
} from '@/components/game/city/chill/constants';
import { VIEW_WIDTH } from '@/lib/venues';

const LANDING_HERO_SCR_H = 192;
const LANDING_HERO_TRUSS_H = 22;
const LANDING_HERO_SCREEN_INSET = 10;

function scaledChillY(unscaledY: number): number {
  return WHICH_STAGE_PUSH_Y + TENTAROO_GND + WHICH_STAGE_SCALE * (unscaledY - TENTAROO_GND);
}

function landingHeroScreenFracs(): { top: number; height: number } {
  const rowTop = WHICH_STAGE_TRUSS_Y + LANDING_HERO_TRUSS_H + WHICH_STAGE_HERO_ROW_GAP;
  const outerH = LANDING_HERO_SCR_H + LANDING_HERO_SCREEN_INSET * 2;
  const screenTop = scaledChillY(rowTop) - LANDING_HERO_VB_Y;
  const screenH = scaledChillY(rowTop + outerH) - scaledChillY(rowTop);
  return {
    top: screenTop / LANDING_HERO_VB_H,
    height: screenH / LANDING_HERO_VB_H,
  };
}

/** Mobile static stage — show full rig width without side crop. */
export const MOBILE_STATIC_VB_WIDTH = 900;
export const MOBILE_STATIC_VB_HEIGHT = 900;
/** Re-centre 900-wide window on same world centre as desktop 1400-wide slice. */
export const MOBILE_STATIC_VB_X_OFFSET = 250;

export function isMobileStaticViewport(
  width = typeof window !== 'undefined' ? window.innerWidth : VIEW_WIDTH,
): boolean {
  return width <= 767;
}

export function staticMobileViewBoxX(layerVx: number): number {
  return layerVx + MOBILE_STATIC_VB_X_OFFSET;
}

export function staticMobileViewBox(
  layerVx: number,
): string {
  return `${staticMobileViewBoxX(layerVx)} 0 ${MOBILE_STATIC_VB_WIDTH} ${MOBILE_STATIC_VB_HEIGHT}`;
}

/** Crop sky/forest above truss so stage lights sit flush under the nav. */
export const LANDING_HERO_VB_Y = 85;
export const LANDING_HERO_VB_H = 900 - LANDING_HERO_VB_Y;

/** Scaled Nature rig screen — matches createCreatorMainStage heroLayout geometry. */
const heroScreenFracs = landingHeroScreenFracs();
export const LANDING_HERO_SCREEN_TOP_FRAC = heroScreenFracs.top;
export const LANDING_HERO_SCREEN_HEIGHT_FRAC = heroScreenFracs.height;

export function landingHeroDesktopViewBox(layerVx: number): string {
  return `${layerVx} ${LANDING_HERO_VB_Y} ${VIEW_WIDTH} ${LANDING_HERO_VB_H}`;
}

export function landingHeroMobileViewBox(layerVx: number): string {
  return `${staticMobileViewBoxX(layerVx)} ${LANDING_HERO_VB_Y} ${MOBILE_STATIC_VB_WIDTH} ${LANDING_HERO_VB_H}`;
}

/** Landing hero mobile — pin stage rig to top of viewport (below nav). */
export const LANDING_HERO_MOBILE_PAR = 'xMidYMin meet' as const;
/** Landing hero desktop — pin truss/lights just under nav header. */
export const LANDING_HERO_DESKTOP_PAR = 'xMidYMin slice' as const;
export const DESKTOP_STATIC_PAR = 'xMidYMid slice' as const;
