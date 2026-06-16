import type { HTMLAttributes } from 'react';
import { CHILL_FOREST_BG, CHILL_FOREST_LAYERS, CHILL_MID_TILE_H, CHILL_MID_TILE_W } from './constants';
import './chillForest.css';

/** Animated forest skyline — rise-in only, no parallax. */
export function ChillForestLayer() {
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
