/** Adapted from https://github.com/mxmarchal/pixel-llm (MIT) */

export type CanvasSize = { width: number; height: number };

export type GridPixel = {
  x: number;
  y: number;
  /** Palette index 0–3 for easel strokes. */
  pi: number;
};
