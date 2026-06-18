import { GradientMidTerrain } from '../shared/GradientMidTerrain';
import { BalloonChain } from './BalloonChain';
import { DesertMountains } from './DesertMountains';
import { FestivalWheel } from './FestivalWheel';
import { Palm } from './Palm';
import { StringLights } from './StringLights';
import { Tent } from './Tent';
import {
  COACHELLA_BACKDROP_FILL,
  COACHELLA_MID_TILE_H,
  COACHELLA_STATIC_VIEWPORT_W,
  COACHELLA_STATIC_VIEWPORT_X,
} from './constants';

const STATIC_CLIP_ID = 'coachella-static-viewport-clip';

type DesertSceneProps = {
  tileIndex: number;
  /** Fixed-camera mode — clip mid-layer art to the static viewport slice. */
  fitViewport?: boolean;
};

/** Coachella Valley desert — ridges, festival decor, and palms. */
export function DesertScene({ tileIndex, fitViewport = false }: DesertSceneProps) {
  if (!fitViewport) {
    return (
      <>
        <GradientMidTerrain tileIndex={tileIndex} />
        <DesertMountains tileIndex={tileIndex} />
        <Tent x={1580} w={150} h={150} col="#ede7dd" />
        <FestivalWheel />
        <BalloonChain />
        <StringLights />
        <Tent x={1880} w={92} h={86} col="#e9d8c0" />
        <Palm x={1640} h={120} lean={7} />
        <Palm x={1980} h={104} lean={-6} />
        <Palm x={2490} h={128} lean={6} />
      </>
    );
  }

  const vx = COACHELLA_STATIC_VIEWPORT_X;
  const vw = COACHELLA_STATIC_VIEWPORT_W;
  const vh = COACHELLA_MID_TILE_H;

  return (
    <>
      <rect x={vx} y={0} width={vw} height={vh} fill={COACHELLA_BACKDROP_FILL} />
      <defs>
        <clipPath id={STATIC_CLIP_ID}>
          <rect x={vx} y={0} width={vw} height={vh} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${STATIC_CLIP_ID})`}>
        <GradientMidTerrain tileIndex={tileIndex} />
        <DesertMountains tileIndex={tileIndex} />
        <Tent x={120} w={130} h={120} col="#ede7dd" />
        <FestivalWheel cx={300} />
        <BalloonChain x={380} />
        <StringLights xs={[160, 380, 600, 820]} />
        <Tent x={1050} w={92} h={86} col="#e9d8c0" />
        <Palm x={180} h={120} lean={7} />
        <Palm x={460} h={104} lean={-6} />
        <Palm x={1120} h={128} lean={6} />
      </g>
    </>
  );
}
