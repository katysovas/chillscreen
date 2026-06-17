import { GradientMidTerrain } from '../shared/GradientMidTerrain';
import { LasVegasSkyline } from './LasVegasSkyline';
import {
  VEGAS_BACKDROP_FILL,
  VEGAS_MID_TILE_H,
  VEGAS_STATIC_VIEWPORT_W,
  VEGAS_STATIC_VIEWPORT_X,
} from './constants';

const STATIC_CLIP_ID = 'vegas-static-viewport-clip';

type VegasSceneProps = {
  tileIndex: number;
  /** Fixed-camera mode — clip mid-layer art to the static viewport slice. */
  fitViewport?: boolean;
};

/** Las Vegas mid tile — desert ridge, Strip skyline, Sphere, and landmarks. */
export function VegasScene({ tileIndex, fitViewport = false }: VegasSceneProps) {
  if (!fitViewport) {
    return (
      <>
        <GradientMidTerrain tileIndex={tileIndex} />
        <LasVegasSkyline />
      </>
    );
  }

  const vx = VEGAS_STATIC_VIEWPORT_X;
  const vw = VEGAS_STATIC_VIEWPORT_W;
  const vh = VEGAS_MID_TILE_H;

  return (
    <>
      <rect x={vx} y={0} width={vw} height={vh} fill={VEGAS_BACKDROP_FILL} />
      <defs>
        <clipPath id={STATIC_CLIP_ID}>
          <rect x={vx} y={0} width={vw} height={vh} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${STATIC_CLIP_ID})`}>
        <GradientMidTerrain tileIndex={tileIndex} />
        <LasVegasSkyline staticViewport />
      </g>
    </>
  );
}
