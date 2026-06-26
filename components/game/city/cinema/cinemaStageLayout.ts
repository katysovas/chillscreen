import {
  TENTAROO_GND,
  WHICH_STAGE_MID_X,
  WHICH_STAGE_PUSH_Y,
  WHICH_STAGE_SCALE,
} from './constants';

export const CINEMA_SCREEN_W = 340;
export const CINEMA_SCREEN_H = 192;
/** Matches createCreatorMainStage default rigScrY. */
export const CINEMA_SCREEN_Y = 406;

/** LED screen rect in SVG root coordinates (after stage scale + push). */
export function getCinemaVideoScreenRect(
  midX = WHICH_STAGE_MID_X,
  stageScale = WHICH_STAGE_SCALE,
) {
  const scrX = midX - CINEMA_SCREEN_W / 2;
  const S = stageScale;
  const pushY = WHICH_STAGE_PUSH_Y;
  const ox = midX;
  const oy = TENTAROO_GND;
  return {
    x: ox + S * (scrX - ox),
    y: oy + S * (CINEMA_SCREEN_Y - oy) + pushY,
    width: CINEMA_SCREEN_W * S,
    height: CINEMA_SCREEN_H * S,
    borderRadius: 6 * S,
  };
}
