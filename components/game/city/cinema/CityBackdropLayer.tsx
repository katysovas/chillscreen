import type { HTMLAttributes, CSSProperties } from 'react';
import {
  CITY_BLEND_HREF,
  CITY_MID_TILE_H,
  CITY_MID_TILE_W,
  CITY_SKYLINE_HREF,
} from './constants';
import './cityBackdrop.css';

const backdropStyle = {
  '--city-blend-image': `url(${CITY_BLEND_HREF})`,
  '--city-skyline-image': `url(${CITY_SKYLINE_HREF})`,
} as CSSProperties;

/** Animated city skyline — twirling color wash over hard-light skyline. */
export function CityBackdropLayer() {
  return (
    <foreignObject
      x={0}
      y={0}
      width={CITY_MID_TILE_W}
      height={CITY_MID_TILE_H}
      data-city-backdrop
    >
      <div
        {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as HTMLAttributes<HTMLDivElement>)}
        className="city-backdrop"
        style={backdropStyle}
      >
        <div className="city-backdrop__blend" aria-hidden />
        <div className="city-backdrop__city" aria-hidden />
      </div>
    </foreignObject>
  );
}
