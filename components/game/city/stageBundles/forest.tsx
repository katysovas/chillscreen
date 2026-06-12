import { GradientMidTerrain } from '../shared/GradientMidTerrain';
import { TransitionWater } from '../transition';
import { ForestTile, ForestStage, FOREST_STAGE_MID_X } from '../forest';
import { StageToiletsFlanking } from '../street/StageToiletRow';
import { FOREST_STAGE_TOILET_HALF } from '../forest/constants';
import { forestLiveOnTile } from './liveTile';
import type { StageMidBundleModule } from './types';

export const bundle = {
  CityTileBody(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <GradientMidTerrain tileIndex={props.tileIndex} />
        <TransitionWater tileIndex={props.tileIndex} />
        <ForestTile />
        <StageToiletsFlanking
          centerX={FOREST_STAGE_MID_X}
          stageHalfWidth={FOREST_STAGE_TOILET_HALF}
        />
      </>
    );
  },
  CityTileForeground(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileForeground']>>[0]) {
    return (
      <ForestStage live={forestLiveOnTile(props)} />
    );
  },
} satisfies StageMidBundleModule['bundle'];
