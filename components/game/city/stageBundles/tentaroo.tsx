import { TentarooArchLabel, TentarooTile, WhichStage } from '../tentaroo';
import {
  TENTAROO_BACKDROP_FILL,
  TENTAROO_MID_TILE_H,
  TENTAROO_STATIC_VIEWPORT_W,
  TENTAROO_STATIC_VIEWPORT_X,
  TENTAROO_TOILET_DROP_Y,
  WHICH_STAGE_MID_X,
  WHICH_STAGE_TOILET_HALF,
} from '../tentaroo/constants';
import { StageToiletsFlanking } from '../street/StageToiletRow';
import { whichStageLiveOnTile } from './liveTile';
import type { StageMidBundleModule } from './types';
import { STAGE_TOILET } from '@/lib/stageToilets';

export const bundle = {
  CityTileBody(_props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <rect
          x={TENTAROO_STATIC_VIEWPORT_X}
          y={0}
          width={TENTAROO_STATIC_VIEWPORT_W}
          height={TENTAROO_MID_TILE_H}
          fill={TENTAROO_BACKDROP_FILL}
        />
        <TentarooTile fitViewport />
        <StageToiletsFlanking
          centerX={WHICH_STAGE_MID_X}
          stageHalfWidth={WHICH_STAGE_TOILET_HALF}
          y={STAGE_TOILET.sidewalkY + TENTAROO_TOILET_DROP_Y}
        />
      </>
    );
  },
  CityTileForeground(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileForeground']>>[0]) {
    return (
      <WhichStage live={whichStageLiveOnTile(props)} staticViewport />
    );
  },
  CityTileSkyLabels({ tileIndex: t }: { tileIndex: number }) {
    return <TentarooArchLabel tile={t} />;
  },
} satisfies StageMidBundleModule['bundle'];
