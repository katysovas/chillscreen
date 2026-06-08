import { MID_W } from '../shared/terrainPaths';
import { DECORATIVE_SHAPE } from '../shared/parallaxLayerStyle';
import { worldTileKind } from '@/lib/worldTiles';
import { MountRainier } from './MountRainier';
import { EvergreenHills } from './EvergreenHills';
import { GreatWheel } from './GreatWheel';
import { SpaceNeedle } from './SpaceNeedle';

type SeattleMidFeaturesProps = {
  tileIndex: number;
};

/** Seattle landmarks with edge fade so they don't pop in at tile boundaries. */
export function SeattleMidFeatures({ tileIndex }: SeattleMidFeaturesProps) {
  const uid = `sf${tileIndex}`;
  const leftTown = worldTileKind(tileIndex - 1) === 'town';
  const rightTown = worldTileKind(tileIndex + 1) === 'town';

  return (
    <g {...DECORATIVE_SHAPE}>
      <defs>
        <linearGradient id={`sein-${uid}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={MID_W} y2={0}>
          <stop offset="0%" stopColor="white" stopOpacity={leftTown ? 0 : 1} />
          <stop offset="18%" stopColor="white" stopOpacity={1} />
          <stop offset="82%" stopColor="white" stopOpacity={1} />
          <stop offset="100%" stopColor="white" stopOpacity={rightTown ? 0 : 1} />
        </linearGradient>
        <linearGradient id={`sein-l-${uid}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={720} y2={0}>
          <stop offset="0%" stopColor="white" stopOpacity={0} />
          <stop offset="100%" stopColor="white" stopOpacity={1} />
        </linearGradient>
        <mask id={`sea-m-${uid}`}>
          <rect width={MID_W} height={900} fill={`url(#sein-${uid})`} />
        </mask>
        <mask id={`sea-lm-${uid}`}>
          <rect width={MID_W} height={900} fill={`url(#sein-l-${uid})`} />
        </mask>
      </defs>
      <g mask={`url(#sea-m-${uid})`}>
        <MountRainier />
        <EvergreenHills />
      </g>
      <g mask={`url(#sea-lm-${uid})`}>
        <GreatWheel />
        <SpaceNeedle />
      </g>
    </g>
  );
}
