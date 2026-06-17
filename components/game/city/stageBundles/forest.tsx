import { ForestTile, ForestStage, FOREST_STAGE_MID_X } from '../forest';
import {
  FOREST_BACKDROP_FILL,
  FOREST_MID_TILE_H,
  FOREST_STATIC_VIEWPORT_W,
  FOREST_STATIC_VIEWPORT_X,
  FOREST_STAGE_TOILET_HALF,
  FOREST_TOILET_DROP_Y,
} from '../forest/constants';
import { StageToiletsFlanking } from '../street/StageToiletRow';
import { forestLiveOnTile } from './liveTile';
import type { StageMidBundleModule } from './types';
import { STAGE_TOILET } from '@/lib/stageToilets';

export const bundle = {
  CityTileBody(_props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <rect
          x={FOREST_STATIC_VIEWPORT_X}
          y={0}
          width={FOREST_STATIC_VIEWPORT_W}
          height={FOREST_MID_TILE_H}
          fill={FOREST_BACKDROP_FILL}
        />
        <ForestTile fitViewport />
        <StageToiletsFlanking
          centerX={FOREST_STAGE_MID_X}
          stageHalfWidth={FOREST_STAGE_TOILET_HALF}
          y={STAGE_TOILET.sidewalkY + FOREST_TOILET_DROP_Y}
        />
      </>
    );
  },
  CityTileForeground(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileForeground']>>[0]) {
    return (
      <ForestStage live={forestLiveOnTile(props)} staticViewport />
    );
  },
} satisfies StageMidBundleModule['bundle'];
