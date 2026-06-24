import type { HTMLAttributes } from 'react';
import { useLandingHero } from '@/components/landing/LandingHeroContext';
import {
  CHILL_FOREST_BG,
  CHILL_FOREST_LAYERS,
  CHILL_MID_TILE_H,
  CHILL_MID_TILE_W,
  LANDING_HERO_GRASS_BLEED,
  LANDING_HERO_GRASS_PAINT_TOP,
  LANDING_GRASS_FILL,
  LANDING_HERO_SKY,
} from './constants';
import './chillForest.css';

const LANDING_FOREST_CLIP_ID = 'landing-chill-forest-clip';
const LANDING_FOREST_GRASS_CAP_ID = 'landing-chill-forest-grass-cap';

/** Animated forest skyline — rise-in only, no parallax. */
export function ChillForestLayer() {
  const landingHero = useLandingHero();

  // Landing: native SVG images — Safari composites foreignObject above sibling shapes.
  if (landingHero) {
    const capTop = LANDING_HERO_GRASS_PAINT_TOP - LANDING_HERO_GRASS_BLEED;
    const capH = LANDING_HERO_GRASS_BLEED + 24;

    return (
      <g data-chill-forest data-chill-forest-landing>
        <defs>
          <clipPath id={LANDING_FOREST_CLIP_ID}>
            <rect x={0} y={0} width={CHILL_MID_TILE_W} height={LANDING_HERO_GRASS_PAINT_TOP} />
          </clipPath>
          <linearGradient
            id={LANDING_FOREST_GRASS_CAP_ID}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={capTop}
            x2={0}
            y2={capTop + capH}
          >
            <stop offset="0%" stopColor={LANDING_GRASS_FILL} stopOpacity={0} />
            <stop offset="55%" stopColor={LANDING_GRASS_FILL} stopOpacity={0.92} />
            <stop offset="100%" stopColor={LANDING_GRASS_FILL} stopOpacity={1} />
          </linearGradient>
        </defs>
        <rect x={0} y={0} width={CHILL_MID_TILE_W} height={capTop} fill={LANDING_HERO_SKY} />
        <rect
          x={0}
          y={LANDING_HERO_GRASS_PAINT_TOP}
          width={CHILL_MID_TILE_W}
          height={CHILL_MID_TILE_H - LANDING_HERO_GRASS_PAINT_TOP}
          fill={LANDING_GRASS_FILL}
        />
        <g clipPath={`url(#${LANDING_FOREST_CLIP_ID})`}>
          {CHILL_FOREST_LAYERS.map(src => (
            <image
              key={src}
              href={src}
              x={0}
              y={0}
              width={CHILL_MID_TILE_W}
              height={CHILL_MID_TILE_H}
              preserveAspectRatio="xMidYMax slice"
            />
          ))}
        </g>
        <rect x={0} y={capTop} width={CHILL_MID_TILE_W + 2} height={capH} fill={`url(#${LANDING_FOREST_GRASS_CAP_ID})`} />
      </g>
    );
  }

  return (
    <foreignObject
      x={0}
      y={0}
      width={CHILL_MID_TILE_W}
      height={CHILL_MID_TILE_H}
      data-chill-forest
    >
      <div
        {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as HTMLAttributes<HTMLDivElement>)}
        className="chill-forest"
        style={{ background: CHILL_FOREST_BG }}
      >
        {CHILL_FOREST_LAYERS.map(src => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={src}
            className="chill-forest__layer"
            src={src}
            alt=""
            draggable={false}
          />
        ))}
      </div>
    </foreignObject>
  );
}
