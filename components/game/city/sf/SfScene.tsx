import { MidBushes } from '../MidBushes';
import { SfMidFeatures } from '../SfMidFeatures';
import { CityBuildingsTile } from '../buildings/CityBuildingsTile';
import { GradientMidTerrain } from '../shared/GradientMidTerrain';
import { TransitionWater } from '../transition';
import {
  SF_BACKDROP_FILL,
  SF_MID_TILE_H,
  SF_STATIC_VIEWPORT_W,
  SF_STATIC_VIEWPORT_X,
} from './constants';

const STATIC_CLIP_ID = 'sf-static-viewport-clip';

type SfSceneProps = {
  tileIndex: number;
  /** Fixed-camera mode — clip mid-layer art to the static viewport slice. */
  fitViewport?: boolean;
  hideTrees?: boolean;
  /** Override viewport slice x (defaults to Outside Lands framing). */
  viewportX?: number;
};

/** SF mid tile — bay, Golden Gate, skyline, and waterfront hills. */
export function SfScene({ tileIndex, fitViewport = false, hideTrees = false, viewportX }: SfSceneProps) {
  if (!fitViewport) {
    return (
      <>
        <GradientMidTerrain tileIndex={tileIndex} />
        <TransitionWater tileIndex={tileIndex} />
        <CityBuildingsTile />
        {!hideTrees && <MidBushes />}
        <SfMidFeatures />
      </>
    );
  }

  const vx = viewportX ?? SF_STATIC_VIEWPORT_X;
  const vw = SF_STATIC_VIEWPORT_W;
  const vh = SF_MID_TILE_H;

  return (
    <>
      <rect x={vx} y={0} width={vw} height={vh} fill={SF_BACKDROP_FILL} />
      <defs>
        <clipPath id={STATIC_CLIP_ID}>
          <rect x={vx} y={0} width={vw} height={vh} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${STATIC_CLIP_ID})`}>
        <GradientMidTerrain tileIndex={tileIndex} />
        <TransitionWater tileIndex={tileIndex} staticViewport />
        <CityBuildingsTile />
        {!hideTrees && <MidBushes />}
        <SfMidFeatures />
      </g>
    </>
  );
}
