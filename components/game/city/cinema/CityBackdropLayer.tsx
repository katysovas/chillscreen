'use client';

import type { CSSProperties, HTMLAttributes } from 'react';
import { useOptionalCreatorStage } from '@/lib/stages/CreatorStageContext';
import {
  CITY_MID_TILE_H,
  CITY_MID_TILE_W,
  CITY_UPLOAD_BACKDROP_LIFT_Y,
  isCustomCityBackdropUrl,
} from './constants';
import './cityBackdrop.css';

type CityBackdropLayerProps = {
  /** Prefer prop (from MidLayer) — context is a fallback after live upload. */
  skylineUrl?: string | null;
  /**
   * Extra pixels to extend the foreignObject on each side (left and right).
   * Lets the image bleed past the tile edge when the camera walks to the
   * nav-sign positions — prevents a hard colour seam at the backdrop boundary.
   */
  bleedPx?: number;
};

/** Animated city skyline — twirling color wash over hard-light skyline. */
export function CityBackdropLayer({ skylineUrl: skylineUrlProp, bleedPx = 0 }: CityBackdropLayerProps = {}) {
  const stage = useOptionalCreatorStage();
  const skylineUrl = skylineUrlProp ?? stage?.backdropUrl ?? null;
  const customBackdrop = isCustomCityBackdropUrl(skylineUrl);

  return (
    <foreignObject
      x={-bleedPx}
      y={0}
      width={CITY_MID_TILE_W + 2 * bleedPx}
      height={CITY_MID_TILE_H}
      data-city-backdrop
    >
      <div
        {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as HTMLAttributes<HTMLDivElement>)}
        className="city-backdrop"
      >
        {/* Wrappers carry blend-mode + filter animations (matches CodePen div.blend / div.city). */}
        <div className="city-backdrop__blend" aria-hidden />
        <div
          className={customBackdrop ? 'city-backdrop__city city-backdrop__city--upload' : 'city-backdrop__city'}
          style={
            customBackdrop
              ? ({ '--city-upload-lift': `${CITY_UPLOAD_BACKDROP_LIFT_Y}px` } as CSSProperties)
              : undefined
          }
          aria-hidden
        >
          {skylineUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={skylineUrl} src={skylineUrl} alt="" draggable={false} />
          )}
          <div className="city-backdrop__vignette" />
        </div>
      </div>
    </foreignObject>
  );
}
