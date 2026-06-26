'use client';

import { CITY_BACKDROP_FILL, CITY_MID_TILE_H, TENTAROO_GND } from './constants';

/** Matches CityBackdropLayer — horizon anchored at the stage ground line. */
const BACKDROP_OBJECT_POSITION = `center ${(TENTAROO_GND / CITY_MID_TILE_H) * 100}%`;

/** Full-viewport stage photo — avoids SVG foreignObject / viewBox alignment issues. */
export function StageBackdropFill({ url }: { url?: string | null }) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 1,
        pointerEvents: 'none',
        backgroundColor: CITY_BACKDROP_FILL,
        overflow: 'hidden',
      }}
    >
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={url}
          src={url}
          alt=""
          draggable={false}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: BACKDROP_OBJECT_POSITION,
          }}
        />
      ) : null}
    </div>
  );
}
