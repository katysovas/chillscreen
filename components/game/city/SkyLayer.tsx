import { forwardRef, memo, useCallback, useMemo } from 'react';
import { SKY_F, SKY_TILE } from '@/lib/parallax';
import { skyTheme, type SkyPeriod } from '@/lib/skyTimeOfDay';
import { ParallaxSvgLayer } from './shared/ParallaxSvgLayer';
import { Sun } from './sky/Sun';
import { Moon } from './sky/Moon';

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
 * Sky background at SKY_F — sun/moon here; clouds in SkyCloudsLayer. Both render before MidLayer.
 */
export const SkyLayer = memo(forwardRef<SVGSVGElement, SkyLayerProps>(
  function SkyLayer({ worldOff, period }, ref) {
    const vx     = worldOff * SKY_F;
    const theme  = skyTheme(period);
    const gradId = `sky-bg-${period}`;

    const skyDefs = useMemo(() => (
      <>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          {theme.gradient.map(s => (
            <stop key={s.offset} offset={s.offset} stopColor={s.color} />
          ))}
        </linearGradient>
        <filter id="sunf" x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="sunf2" x="-55%" y="-55%" width="210%" height="210%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </>
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [period]);

    const renderTile = useCallback(() => (
      <>
        <rect x={0} y={0} width={SKY_TILE} height={900} fill={`url(#${gradId})`} shapeRendering="optimizeSpeed" />

        <rect x={0} y={640} width={SKY_TILE} height={100} fill={theme.haze} shapeRendering="optimizeSpeed" />

        <path
          d="M0,665 Q500,620 1000,640 Q1500,658 2000,665 L2000,730 L0,730 Z"
          fill={theme.horizon}
          shapeRendering="optimizeSpeed"
        />

        {theme.showStars && SKY_STAR_FIELD.map((s, i) => (
          <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.opacity} />
        ))}

        {theme.sun && (
          <Sun
            cx={theme.sun.cx}
            cy={theme.sun.cy}
            core={theme.sun.core}
            glow={theme.sun.glow}
          />
        )}
        {theme.moon && (
          <Moon
            cx={theme.moon.cx}
            cy={theme.moon.cy}
            skyTop={theme.gradient[0].color}
          />
        )}
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
