import { forwardRef, memo, useCallback, useMemo } from 'react';
import { SKY_F, SKY_TILE } from '@/lib/parallax';
import { skyTheme, type SkyPeriod } from '@/lib/skyTimeOfDay';
import { ParallaxSvgLayer } from './shared/ParallaxSvgLayer';

type SkyLayerProps = {
  worldOff: number;
  period: SkyPeriod;
};

// Stars pre-computed at module load, distributed uniformly in tile-space (0..SKY_TILE).
const SKY_STAR_FIELD = Array.from({ length: 88 }, (_, i) => ({
  x: (i * 247 + 67) % SKY_TILE,
  y: 8 + (i * 89) % 580,
  r: 0.55 + (i % 4) * 0.5,
  opacity: 0.32 + (i % 6) * 0.11,
}));

/**
 * Sky background layer — tiling ParallaxSvgLayer at SKY_F speed.
 *
 * WHY TILING INSTEAD OF STATIC:
 * The previous static SVG (`viewBox="0 0 1400 900"`) was a screen-space
 * backdrop while every other layer scrolled in world-space.  Any element in
 * a parallax tile that painted a sky-coloured fill would be a slightly
 * different shade to the static gradient, showing as a vertical seam at
 * tile boundaries.
 *
 * By making the sky tile at SKY_F speed (same as SkyCloudsLayer), the sky
 * background comes from the SAME vertical gradient everywhere.  Adjacent tiles
 * share identical colours at every y-position — exactly like GroundLayer —
 * so there is zero seam, by construction.
 */
export const SkyLayer = memo(forwardRef<SVGSVGElement, SkyLayerProps>(
  function SkyLayer({ worldOff, period }, ref) {
    const vx     = worldOff * SKY_F;
    const theme  = skyTheme(period);
    const gradId = `sky-bg-${period}`;

    // Gradient definition — memoised so it only changes when the period changes.
    const skyDefs = useMemo(() => (
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          {theme.gradient.map(s => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
      </defs>
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [period]);

    // Tile render function — stable across worldOff changes, recreated only on period change.
    const renderTile = useCallback(() => (
      <>
        {/* Sky gradient — gradientUnits=objectBoundingBox (default) maps y=0..1 to
            the rect's full height. Every tile has IDENTICAL stop colours at each
            y-position, regardless of which tile index or x-translation is in use. */}
        <rect x={0} y={0} width={SKY_TILE} height={900} fill={`url(#${gradId})`} shapeRendering="optimizeSpeed" />

        {/* Horizon haze */}
        <rect x={0} y={640} width={SKY_TILE} height={100} fill={theme.haze} shapeRendering="optimizeSpeed" />

        {/* Horizon silhouette — starts and ends at y=665 so adjacent tiles join seamlessly */}
        <path
          d="M0,665 Q500,620 1000,640 Q1500,658 2000,665 L2000,730 L0,730 Z"
          fill={theme.horizon}
          shapeRendering="optimizeSpeed"
        />

        {/* Stars — only visible in night / evening */}
        {theme.showStars && SKY_STAR_FIELD.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.opacity} />
        ))}
      </>
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [period]);

    return (
      <ParallaxSvgLayer
        ref={ref}
        viewBoxX={vx}
        tileWidth={SKY_TILE}
        defs={skyDefs}
        shapeRendering="optimizeSpeed"
        style={{
          pointerEvents: 'none',
          transition: 'opacity .8s ease',
        }}
      >
        {renderTile}
      </ParallaxSvgLayer>
    );
  },
));
