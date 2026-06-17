'use client';

import type { HTMLAttributes } from 'react';
import { useOptionalCreatorStage } from '@/lib/stages/CreatorStageContext';
import {
  CITY_BACKDROP_FILL,
  CITY_MID_TILE_H,
  CITY_MID_TILE_W,
  CITY_STATIC_VIEWPORT_W,
  CITY_STATIC_VIEWPORT_X,
  TENTAROO_GND,
} from './constants';

type CityBackdropLayerProps = {
  /** Prefer prop (from MidLayer) — context is a fallback after live upload. */
  skylineUrl?: string | null;
  /**
   * Extra pixels to extend the foreignObject on each side (left and right).
   * Lets the image bleed past the tile edge when the camera walks to the
   * nav-sign positions — prevents a hard colour seam at the backdrop boundary.
   */
  bleedPx?: number;
  /** Fixed-camera city template — backdrop covers the viewport slice only. */
  fitViewport?: boolean;
};

/** City skyline photo (or fallback fill when no upload). */
export function CityBackdropLayer({
  skylineUrl: skylineUrlProp,
  bleedPx = 0,
  fitViewport = false,
}: CityBackdropLayerProps = {}) {
  const stage = useOptionalCreatorStage();
  const skylineUrl = skylineUrlProp ?? stage?.backdropUrl ?? null;
  const foX = fitViewport ? CITY_STATIC_VIEWPORT_X : -bleedPx;
  const foW = fitViewport ? CITY_STATIC_VIEWPORT_W : CITY_MID_TILE_W + 2 * bleedPx;

  return (
    <foreignObject
      x={foX}
      y={0}
      width={foW}
      height={CITY_MID_TILE_H}
      data-city-backdrop
    >
      <div
        {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as HTMLAttributes<HTMLDivElement>)}
        style={{
          position: 'relative',
          overflow: 'hidden',
          width: '100%',
          height: '100%',
          background: CITY_BACKDROP_FILL,
          pointerEvents: 'none',
        }}
      >
        {skylineUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={skylineUrl}
            src={skylineUrl}
            alt=""
            draggable={false}
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: `center ${(TENTAROO_GND / CITY_MID_TILE_H) * 100}%`,
            }}
          />
        )}
      </div>
    </foreignObject>
  );
}
