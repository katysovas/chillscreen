import type { CSSProperties, SVGProps } from 'react';

/** Hint for large decorative SVG geometry (terrain, silhouettes, crowds). */
export const DECORATIVE_SHAPE: Pick<SVGProps<SVGElement>, 'shapeRendering'> = {
  shapeRendering: 'optimizeSpeed',
};

/** Compositor hints for full-screen parallax layers — isolate paint during scroll. */
export const PARALLAX_LAYER_COMPOSITING: Pick<CSSProperties, 'willChange' | 'contain'> = {
  willChange: 'transform',
  contain: 'layout style paint',
};

/** Base layout for absolute full-viewport parallax layers. */
export const PARALLAX_LAYER_BASE: CSSProperties = {
  position: 'absolute',
  inset: 0,
  ...PARALLAX_LAYER_COMPOSITING,
};
