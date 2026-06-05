import { forwardRef, memo, useCallback } from 'react';
import { SKY_F, SKY_TILE } from '@/lib/parallax';
import { skyTheme, type SkyPeriod } from '@/lib/skyTimeOfDay';
import { ParallaxSvgLayer } from './shared/ParallaxSvgLayer';
import { Cloud } from './sky/Cloud';
import { SKY_CLOUDS } from './sky/cloudLayout';
import { Sun } from './sky/Sun';
import { Moon } from './sky/Moon';

type SkyCloudsLayerProps = {
  worldOff: number;
  period: SkyPeriod;
};

/**
 * Scrolling sky layer: sun/moon + clouds.
 * Everything here scrolls at SKY_F (8 %) of world speed, so the sun drifts
 * slowly across the sky as the player walks — it never stays pinned to screen.
 *
 * Sun/moon are placed at fixed tile-space coordinates and repeat with every
 * SKY_TILE (2000 sky-units). Because the 1400 px viewport is narrower than one
 * tile, at most one sun/moon is visible at a time.
 */
export const SkyCloudsLayer = memo(forwardRef<SVGSVGElement, SkyCloudsLayerProps>(
  function SkyCloudsLayer({ worldOff, period }, ref) {
    const vx    = worldOff * SKY_F;
    const theme = skyTheme(period);

    // Sun/moon filter defs — filter regions expanded well beyond the 10 % default
    // so the soft outer glow fades to zero naturally instead of being hard-clipped.
    // For sunf2 (σ=22, r=125): blur needs ~66px margin, default gives only 25px.
    // For sunf  (σ=10, r=82):  blur needs ~30px margin, default gives only 16px.
    const skyDefs = (
      <>
        <filter id="sunf"  x="-35%" y="-35%" width="170%" height="170%">
          <feGaussianBlur stdDeviation="10" />
        </filter>
        <filter id="sunf2" x="-55%" y="-55%" width="210%" height="210%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
      </>
    );

    // Stable tile render function — recreated only when period changes.
    const renderTile = useCallback(() => (
      <>
        {/* Sun / Moon — placed at a fixed tile-space position so they scroll
            with the clouds at SKY_F speed instead of being pinned to screen.
            Tile width is 2000; viewport is 1400 — only one is ever visible. */}
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

        {/* Clouds — only rendered when the theme has them */}
        {theme.showClouds && SKY_CLOUDS.map((c, i) => (
          <Cloud
            key={i}
            x={c.x}
            y={c.y}
            s={c.s}
            anim={c.anim}
            del={c.del}
            variant={theme.cloudVariant}
          />
        ))}
      </>
    // eslint-disable-next-line react-hooks/exhaustive-deps
    ), [period]); // all derived from period

    return (
      <ParallaxSvgLayer
        ref={ref}
        viewBoxX={vx}
        tileWidth={SKY_TILE}
        defs={skyDefs}
        shapeRendering="optimizeSpeed"
        style={{ pointerEvents: 'none' }}
      >
        {renderTile}
      </ParallaxSvgLayer>
    );
  },
));
