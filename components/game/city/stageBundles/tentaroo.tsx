import { GradientMidTerrain } from '../shared/GradientMidTerrain';
import { TransitionWater } from '../transition';
import { TentarooArchLabel, TentarooTile, WhichStage, WhichStageTrussLabel } from '../tentaroo';
import { StageToiletsFlanking } from '../street/StageToiletRow';
import { WHICH_STAGE_MID_X, WHICH_STAGE_TOILET_HALF } from '../tentaroo/constants';
import { whichStageLiveOnTile } from './liveTile';
import type { StageMidBundleModule } from './types';

export const bundle = {
  CityTileBody(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <GradientMidTerrain tileIndex={props.tileIndex} />
        <TransitionWater tileIndex={props.tileIndex} />
        <TentarooTile />
        <StageToiletsFlanking
          centerX={WHICH_STAGE_MID_X}
          stageHalfWidth={WHICH_STAGE_TOILET_HALF}
        />
      </>
    );
  },
  CityTileForeground(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileForeground']>>[0]) {
    return (
      <WhichStage live={whichStageLiveOnTile(props)} />
    );
  },
  CityTileSkyLabels({ tileIndex: t }: { tileIndex: number }) {
    return (
      <>
        <TentarooArchLabel tile={t} />
        <WhichStageTrussLabel tile={t} />
      </>
    );
  },
} satisfies StageMidBundleModule['bundle'];
