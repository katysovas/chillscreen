import { SKY_F, SKY_TILE } from '@/lib/parallax';
import { skyTheme, STAR_FIELD, type SkyPeriod } from '@/lib/skyTimeOfDay';
import { ParallaxSvgLayer } from './shared/ParallaxSvgLayer';
import { Sun } from './sky/Sun';
import { Moon } from './sky/Moon';

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
