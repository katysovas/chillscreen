import { GradientMidTerrain } from '../shared/GradientMidTerrain';
import { TransitionWater } from '../transition';
import { SilentDiscoTile, SilentDiscoStage, SILENT_DISCO_STAGE_MID_X } from '../silent-disco';
import { StageToiletsFlanking } from '../street/StageToiletRow';
import { SILENT_DISCO_STAGE_TOILET_HALF } from '../silent-disco/constants';
import { silentDiscoLiveOnTile } from './liveTile';
import type { StageMidBundleModule } from './types';

export const bundle = {
  CityTileBody(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <GradientMidTerrain tileIndex={props.tileIndex} />
        <TransitionWater tileIndex={props.tileIndex} />
        <SilentDiscoTile />
        <StageToiletsFlanking
          centerX={SILENT_DISCO_STAGE_MID_X}
          stageHalfWidth={SILENT_DISCO_STAGE_TOILET_HALF}
        />
      </>
    );
  },
  CityTileForeground(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileForeground']>>[0]) {
    return (
      <SilentDiscoStage live={silentDiscoLiveOnTile(props)} />
    );
  },
} satisfies StageMidBundleModule['bundle'];
