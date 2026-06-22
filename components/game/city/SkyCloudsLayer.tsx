import { forwardRef, memo, useCallback } from 'react';
import { SKY_TILE } from '@/lib/parallax';
import { skyTheme, type SkyPeriod } from '@/lib/skyTimeOfDay';
import { ParallaxSvgLayer } from './shared/ParallaxSvgLayer';
import { Cloud } from './sky/Cloud';
import { SKY_CLOUDS } from './sky/cloudLayout';

type SkyCloudsLayerProps = {
  period: SkyPeriod;
  /** Initial viewBox x — imperative ref updates handle scroll after mount. */
  initialViewBoxX?: number;
};

/** Scrolling cloud layer at SKY_F — rendered before MidLayer so clouds sit behind stages. */
export const SkyCloudsLayer = memo(forwardRef<SVGSVGElement, SkyCloudsLayerProps>(
  function SkyCloudsLayer({ period, initialViewBoxX = 0 }, ref) {
    const theme = skyTheme(period);

    const renderTile = useCallback(() => (
      <>
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
    ), [period]);

    return (
      <ParallaxSvgLayer
        ref={ref}
        viewBoxX={initialViewBoxX}
        tileWidth={SKY_TILE}
        shapeRendering="optimizeSpeed"
        parallaxLayer="stage"
        style={{ pointerEvents: 'none' }}
      >
        {renderTile}
      </ParallaxSvgLayer>
    );
  },
));
