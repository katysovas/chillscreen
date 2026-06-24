import { EDC_STAGE_PUSH_Y, VEGAS_GND } from './constants';

export const EDC_SCREEN_W = 440;
export const EDC_SCREEN_H = 248;
export const EDC_SCREEN_Y = 404;

/** LED screen rect in SVG root coordinates (after stage scale + push). */
export function getEdcVideoScreenRect(midX: number, stageScale: number) {
  const scrX = midX - EDC_SCREEN_W / 2;
  const S = stageScale;
  const pushY = EDC_STAGE_PUSH_Y;
  const ox = midX;
  const oy = VEGAS_GND;
  return {
    x: ox + S * (scrX - ox),
    y: oy + S * (EDC_SCREEN_Y - oy) + pushY,
    width: EDC_SCREEN_W * S,
    height: EDC_SCREEN_H * S,
    borderRadius: 6 * S,
  };
}
