import { SKY_F, SKY_TILE } from '@/lib/parallax';
import { skyTheme, STAR_FIELD, type SkyPeriod } from '@/lib/skyTimeOfDay';
import { ParallaxSvgLayer } from './shared/ParallaxSvgLayer';
import { Cloud } from './sky/Cloud';
import { Sun } from './sky/Sun';
import { Moon } from './sky/Moon';

const CLOUDS = [
  { x: 80, y: 95, s: 1.1, anim: 'cloud2', del: 0 },
  { x: 360, y: 68, s: 1.4, anim: 'cloud1', del: 3 },
  { x: 660, y: 110, s: 0.9, anim: 'cloud3', del: 5 },
  { x: 960, y: 72, s: 1.2, anim: 'cloud2', del: 2 },
  { x: 1250, y: 100, s: 1.0, anim: 'cloud1', del: 7 },
  { x: 1540, y: 78, s: 1.3, anim: 'cloud3', del: 4 },
  { x: 1780, y: 112, s: 0.85, anim: 'cloud2', del: 6 },
] as const;

type SkyLayerProps = {
  worldOff: number;
  period: SkyPeriod;
};

export function SkyLayer({ worldOff, period }: SkyLayerProps) {
  const vx = worldOff * SKY_F;
  const theme = skyTheme(period);
  const gradId = `sky-${period}`;

  return (
    <ParallaxSvgLayer
      viewBoxX={vx}
      tileWidth={SKY_TILE}
      style={{ transition: 'opacity .8s ease' }}
      defs={
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            {theme.gradient.map(s => (
              <stop key={s.offset} offset={s.offset} stopColor={s.color} />
            ))}
          </linearGradient>
          <filter id="sunf">
            <feGaussianBlur stdDeviation="10" />
          </filter>
          <filter id="sunf2">
            <feGaussianBlur stdDeviation="22" />
          </filter>
        </defs>
      }
    >
      {() => (
        <>
          <rect x={0} y={0} width={SKY_TILE} height={900} fill={`url(#${gradId})`} />
          <rect x={0} y={640} width={SKY_TILE} height={100} fill={theme.haze} />
          {theme.sun && (
            <Sun cx={theme.sun.cx} cy={theme.sun.cy} core={theme.sun.core} glow={theme.sun.glow} />
          )}
          {theme.moon && (
            <Moon cx={theme.moon.cx} cy={theme.moon.cy} skyTop={theme.gradient[0].color} />
          )}
          {theme.showStars &&
            STAR_FIELD.map((s, i) => (
              <circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#fff" opacity={s.opacity} />
            ))}
          <path
            d="M0,665 Q300,618 600,638 Q900,655 1200,615 Q1600,580 2000,605 L2000,730 L0,730 Z"
            fill={theme.horizon}
          />
          {theme.showClouds &&
            CLOUDS.map((c, i) => (
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
          <g
            transform="translate(500,255)"
            opacity={period === 'night' ? 0.15 : 0.55}
            style={{ animation: 'sw2 5s ease-in-out infinite' }}
          >
            <path d="M0,0 L9,-6 L18,0" stroke={theme.birdStroke} strokeWidth={2} fill="none" />
            <path d="M24,4 L33,-2 L42,4" stroke={theme.birdStroke} strokeWidth={1.8} fill="none" />
            <path d="M48,1 L57,-5 L66,1" stroke={theme.birdStroke} strokeWidth={1.6} fill="none" />
          </g>
          <g
            transform="translate(1300,220)"
            opacity={period === 'night' ? 0.12 : 0.42}
            style={{ animation: 'sw1 6s ease-in-out infinite' }}
          >
            <path d="M0,0 L9,-5 L18,0" stroke={theme.birdStroke} strokeWidth={1.8} fill="none" />
            <path d="M22,3 L31,-2 L40,3" stroke={theme.birdStroke} strokeWidth={1.5} fill="none" />
          </g>
        </>
      )}
    </ParallaxSvgLayer>
  );
}
