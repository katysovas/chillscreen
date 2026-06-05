import { SKY_F, SKY_TILE } from '@/lib/parallax';
import { skyTheme, type SkyPeriod } from '@/lib/skyTimeOfDay';
import { ParallaxSvgLayer } from './shared/ParallaxSvgLayer';
import { Cloud } from './sky/Cloud';
import { SKY_CLOUDS } from './sky/cloudLayout';

type SkyCloudsLayerProps = {
  worldOff: number;
  period: SkyPeriod;
};

/** Clouds above flying birds so wing animations never punch through them. */
export function SkyCloudsLayer({ worldOff, period }: SkyCloudsLayerProps) {
  const vx = worldOff * SKY_F;
  const theme = skyTheme(period);

  if (!theme.showClouds) return null;

  return (
    <ParallaxSvgLayer
      viewBoxX={vx}
      tileWidth={SKY_TILE}
      style={{ pointerEvents: 'none' }}
    >
      {() => (
        <>
          {SKY_CLOUDS.map((c, i) => (
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
      )}
    </ParallaxSvgLayer>
  );
}
