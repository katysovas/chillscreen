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
    { viewBoxX, tileWidth, children, style, className, defs, tileOrigin, nearTileIndices, shapeRendering },
    ref,
  ) {
    // nearTiles / nearMidTiles / nearGndTiles all return exactly [t-1, t, t+1] — 3 tiles.
    const tiles = nearTileIndices?.(viewBoxX) ?? nearTiles(viewBoxX, tileWidth);
    const origin = tileOrigin ?? (t => t * tileWidth);

    return (
      <svg
        ref={ref}
        data-paraloid-svg
        className={className}
        viewBox={`${viewBoxX} 0 1400 900`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        shapeRendering={shapeRendering}
        style={{
          ...PARALLAX_LAYER_BASE,
          ...style,
        }}
      >
        {defs}
        {tiles.map(t => (
          <TileSlot key={t} render={children} tileIndex={t} origin={origin(t)} />
        ))}
      </svg>
    );
  },
);
