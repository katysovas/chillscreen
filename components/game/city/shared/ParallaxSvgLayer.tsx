import type { CSSProperties, ReactNode } from 'react';
import { nearTiles } from '@/lib/parallax';

type ParallaxSvgLayerProps = {
  viewBoxX: number;
  tileWidth: number;
  children: (tileIndex: number) => ReactNode;
  style?: CSSProperties;
  className?: string;
  defs?: ReactNode;
};

/** Full-screen SVG layer with repeating world tiles. */
export function ParallaxSvgLayer({
  viewBoxX,
  tileWidth,
  children,
  style,
  className,
  defs,
}: ParallaxSvgLayerProps) {
  const tiles = nearTiles(viewBoxX, tileWidth);

  return (
    <svg
      className={className}
      viewBox={`${viewBoxX} 0 1400 900`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, ...style }}
    >
      {defs}
      {tiles.map(t => (
        <g key={t} transform={`translate(${t * tileWidth},0)`}>
          {children(t)}
        </g>
      ))}
    </svg>
  );
}
