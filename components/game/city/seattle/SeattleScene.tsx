import { GradientMidTerrain } from '../shared/GradientMidTerrain';
import {
  SEATTLE_BACKDROP_FILL,
  SEATTLE_MID_TILE_H,
  SEATTLE_RAINIER_PEAK_TARGET_X,
  SEATTLE_STATIC_VIEWPORT_W,
  SEATTLE_STATIC_VIEWPORT_X,
} from './constants';
import { EvergreenHills } from './EvergreenHills';
import { MountRainierBehindStage } from './MountRainier';
import { SeattleMidFeatures } from './SeattleMidFeatures';
import { SeattleBuildingsTile } from './buildings/SeattleBuildingsTile';

const STATIC_CLIP_ID = 'seattle-static-viewport-clip';

type SeattleSceneProps = {
  tileIndex: number;
  /** Fixed-camera mode — clip mid-layer art to the static viewport slice. */
  fitViewport?: boolean;
};

/** Seattle mid tile — hills, Rainier, skyline, and waterfront landmarks. */
export function SeattleScene({ tileIndex, fitViewport = false }: SeattleSceneProps) {
  if (!fitViewport) {
    return (
      <>
        <GradientMidTerrain tileIndex={tileIndex} />
        <SeattleMidFeatures tileIndex={tileIndex} />
        <SeattleBuildingsTile />
      </>
    );
  }

  const vx = SEATTLE_STATIC_VIEWPORT_X;
  const vw = SEATTLE_STATIC_VIEWPORT_W;
  const vh = SEATTLE_MID_TILE_H;

  return (
    <>
      <rect x={vx} y={0} width={vw} height={vh} fill={SEATTLE_BACKDROP_FILL} />
      <defs>
        <clipPath id={STATIC_CLIP_ID}>
          <rect x={vx} y={0} width={vw} height={vh} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${STATIC_CLIP_ID})`}>
        <GradientMidTerrain tileIndex={tileIndex} />
        <MountRainierBehindStage peakTargetX={SEATTLE_RAINIER_PEAK_TARGET_X} emphasized />
        <EvergreenHills />
        <SeattleMidFeatures tileIndex={tileIndex} staticViewport />
        <SeattleBuildingsTile staticViewport />
      </g>
    </>
  );
}
