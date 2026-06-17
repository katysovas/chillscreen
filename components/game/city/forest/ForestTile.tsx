import {
  FOREST_MID_TILE_H,
  FOREST_MID_TILE_W,
  FOREST_STATIC_VIEWPORT_W,
  FOREST_STATIC_VIEWPORT_X,
} from './constants';

const SCENE_HREF = '/images/cities/forest-scene.svg?v=3';

const STATIC_CLIP_ID = 'forest-static-viewport-clip';

type ForestTileProps = {
  /** Fixed-camera mode — backdrop covers the viewport slice only. */
  fitViewport?: boolean;
};

/** The Forest — glowing woods, tent camps, totems + fireflies (stage overlays in front). */
export function ForestTile({ fitViewport = false }: ForestTileProps) {
  if (!fitViewport) {
    return (
      <image
        href={SCENE_HREF}
        x={0}
        y={0}
        width={FOREST_MID_TILE_W}
        height={800}
        preserveAspectRatio="xMidYMax meet"
      />
    );
  }

  const vx = FOREST_STATIC_VIEWPORT_X;
  const vw = FOREST_STATIC_VIEWPORT_W;
  const vh = FOREST_MID_TILE_H;

  return (
    <>
      <defs>
        <clipPath id={STATIC_CLIP_ID}>
          <rect x={vx} y={0} width={vw} height={vh} />
        </clipPath>
      </defs>
      <image
        href={SCENE_HREF}
        x={0}
        y={0}
        width={FOREST_MID_TILE_W}
        height={800}
        preserveAspectRatio="xMidYMax slice"
        clipPath={`url(#${STATIC_CLIP_ID})`}
      />
    </>
  );
}
