import { forwardRef, memo, type CSSProperties, type ReactNode, type SVGProps } from 'react';
import { nearTiles } from '@/lib/parallax';
import { PARALLAX_LAYER_BASE } from './parallaxLayerStyle';

type ParallaxSvgLayerProps = {
  viewBoxX: number;
  tileWidth: number;
  children: (tileIndex: number) => ReactNode;
  style?: CSSProperties;
  className?: string;
  defs?: ReactNode;
  /** Variable-width tiles: origin x per tile index. */
  tileOrigin?: (tileIndex: number) => number;
  /** Variable-width tiles: which indices to draw (defaults to uniform nearTiles). */
  nearTileIndices?: (viewBoxX: number) => number[];
  /**
   * SVG shape-rendering hint. Use "optimizeSpeed" for purely decorative
   * background layers (sky, clouds, terrain) where aliasing is imperceptible.
   */
  shapeRendering?: SVGProps<SVGSVGElement>['shapeRendering'];
  /** Mobile venue split — stage strip vs ground strip. */
  parallaxLayer?: 'stage' | 'ground';
  /** Override default viewBox (`${viewBoxX} 0 1400 900`). */
  viewBox?: string;
  preserveAspectRatio?: SVGProps<SVGSVGElement>['preserveAspectRatio'];
  /**
   * When set, use `viewBox="0 0 1400 900"` (zero x-origin) and wrap all tile
   * content in a `<g transform="translate(-contentTranslateX, 0)">`.
   * This is equivalent to a non-zero viewBox x-origin but avoids a Safari WebKit
   * bug where the x component of the viewBox attribute is silently dropped,
   * shifting stage content to the right side of the screen.
   */
  contentTranslateX?: number;
};

// ─── Memoized tile slot ────────────────────────────────────────────────────────
// Defined at module level so the component identity is stable across renders.
// Re-renders only when tileIndex, origin, or the render function reference changes.
const TileSlot = memo(function TileSlot({
  render,
  tileIndex,
  origin,
}: {
  render: (t: number) => ReactNode;
  tileIndex: number;
  origin: number;
}) {
  return (
    <g transform={`translate(${origin},0)`}>
      {render(tileIndex)}
    </g>
  );
});

// ─── Layer ────────────────────────────────────────────────────────────────────
/** Full-screen SVG layer with repeating world tiles. Exactly 3 tiles are drawn. */
export const ParallaxSvgLayer = forwardRef<SVGSVGElement, ParallaxSvgLayerProps>(
  function ParallaxSvgLayer(
    { viewBoxX, tileWidth, children, style, className, defs, tileOrigin, nearTileIndices, shapeRendering, parallaxLayer, viewBox: viewBoxOverride, preserveAspectRatio = 'xMidYMid slice', contentTranslateX },
    ref,
  ) {
    // nearTiles / nearMidTiles / nearGndTiles all return exactly [t-1, t, t+1] — 3 tiles.
    const tiles = nearTileIndices?.(viewBoxX) ?? nearTiles(viewBoxX, tileWidth);
    const origin = tileOrigin ?? (t => t * tileWidth);

    // When contentTranslateX is provided, anchor the viewBox at x=0 and shift
    // the tile group instead. This avoids a Safari WebKit bug where a non-zero
    // viewBox x-origin is silently ignored, placing content at the wrong position.
    const effectiveViewBox = contentTranslateX != null && contentTranslateX !== 0
      ? '0 0 1400 900'
      : (viewBoxOverride ?? `${viewBoxX} 0 1400 900`);

    const tileContent = tiles.map(t => (
      <TileSlot key={t} render={children} tileIndex={t} origin={origin(t)} />
    ));

    return (
      <svg
        ref={ref}
        data-paraloid-svg
        data-paraloid-layer={parallaxLayer}
        className={className}
        viewBox={effectiveViewBox}
        width="100%"
        height="100%"
        preserveAspectRatio={preserveAspectRatio}
        shapeRendering={shapeRendering}
        style={{
          ...PARALLAX_LAYER_BASE,
          ...style,
        }}
      >
        {defs}
        {contentTranslateX != null && contentTranslateX !== 0
          ? <g transform={`translate(${-contentTranslateX},0)`}>{tileContent}</g>
          : tileContent
        }
      </svg>
    );
  },
);
