import {
  TENTAROO_GND,
  WHICH_STAGE_HERO_NAV_GAP,
  WHICH_STAGE_PUSH_Y,
  WHICH_STAGE_SCALE,
  WHICH_STAGE_TRUSS_Y,
} from '@/components/game/city/chill/constants';
import { CITY_GRASS_DROP_Y } from '@/components/game/city/cinema/constants';
import { FOREST_GRASS_DROP_Y } from '@/components/game/city/forest/constants';
import { SEATTLE_GRASS_DROP_Y } from '@/components/game/city/seattle/constants';
import { SF_GRASS_DROP_Y } from '@/components/game/city/sf/constants';
import { VEGAS_GRASS_DROP_Y } from '@/components/game/city/lasvegas/constants';
import { TENTAROO_GRASS_DROP_Y } from '@/components/game/city/tentaroo/constants';
import { CHILL_GRASS_DROP_Y } from '@/components/game/city/chill/constants';
import { SILENT_DISCO_GRASS_DROP_Y } from '@/components/game/city/silent-disco/constants';
import type { VenueRoute } from '@/lib/venueRoutes';
import { VIEW_WIDTH } from '@/lib/venues';

const LANDING_HERO_SCR_H = 192;
const LANDING_HERO_SCREEN_INSET = 10;

function scaledChillY(unscaledY: number): number {
  return WHICH_STAGE_PUSH_Y + TENTAROO_GND + WHICH_STAGE_SCALE * (unscaledY - TENTAROO_GND);
}

function landingHeroScreenFracs(): { top: number; height: number } {
  const rowTop = WHICH_STAGE_TRUSS_Y + WHICH_STAGE_HERO_NAV_GAP;
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

/** Crop sky/forest above stage rig — leave room for nav-to-stage gap. */
export const LANDING_HERO_VB_Y = 55;
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
/** In-game mobile — show full stage width, pin rig below top controls. */
export const MOBILE_VENUE_PAR = 'xMidYMin meet' as const;
/** Mobile ground — stretch lawn to fill the area below the stage. */
export const MOBILE_VENUE_GROUND_PAR = 'xMidYMin slice' as const;
/** Ground-line y in the 900-tall city viewBox (matches GND_Y in GroundLayer). */
export const MOBILE_VENUE_GROUND_Y = 685;
/** Grass plane starts slightly above the sidewalk (GroundLayer GRASS_TOP). */
export const MOBILE_VENUE_GROUND_VB_Y = MOBILE_VENUE_GROUND_Y - 8;
/** Screen gap between stage strip and grass strip on mobile. */
export const MOBILE_VENUE_GROUND_GAP_PX = 100;
/** Stage-only viewBox height — crops grass out of sky/mid layers. */
export const MOBILE_VENUE_STAGE_VB_H = MOBILE_VENUE_GROUND_Y;
export const MOBILE_VENUE_GROUND_VB_H = MOBILE_STATIC_VB_HEIGHT - MOBILE_VENUE_GROUND_VB_Y;

/** Grass plane top in the 900-tall viewBox (GroundLayer GRASS_TOP). */
export const MOBILE_GRASS_PLANE_TOP = MOBILE_VENUE_GROUND_Y - 8;

function mobileGrassDropYForRoute(route: VenueRoute): number {
  switch (route) {
    case 'silent-disco':
      return SILENT_DISCO_GRASS_DROP_Y;
    case 'forest':
      return FOREST_GRASS_DROP_Y;
    case 'tentaroo':
    case 'creator-chill':
    case 'hula':
    case 'headliner':
      return CHILL_GRASS_DROP_Y;
    case 'seattle-concerts':
      return SEATTLE_GRASS_DROP_Y;
    case 'outside-hands':
    case 'cinema':
      return SF_GRASS_DROP_Y;
    case 'edc':
      return VEGAS_GRASS_DROP_Y;
    default:
      return CITY_GRASS_DROP_Y;
  }
}

/** Mobile ground crop — starts exactly at the painted grass plane (no transparent band). */
export function mobileGrassPlaneYForRoute(route: VenueRoute): number {
  return MOBILE_GRASS_PLANE_TOP + mobileGrassDropYForRoute(route);
}

export function staticMobileStageViewBox(layerVx: number): string {
  return `${staticMobileViewBoxX(layerVx)} 0 ${MOBILE_STATIC_VB_WIDTH} ${MOBILE_VENUE_STAGE_VB_H}`;
}

export function staticMobileGroundViewBox(layerVx: number, route: VenueRoute): string {
  const vbY = mobileGrassPlaneYForRoute(route);
  const vbH = MOBILE_STATIC_VB_HEIGHT - vbY;
  return `${staticMobileViewBoxX(layerVx)} ${vbY} ${MOBILE_STATIC_VB_WIDTH} ${vbH}`;
}
