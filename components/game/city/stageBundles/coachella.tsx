import { DesertScene } from '../sandiego/DesertScene';
import { FestivalStage } from '../sandiego/FestivalStage';
import { StageToiletsFlanking } from '../street/StageToiletRow';
import {
  COACHELLA_STATIC_STAGE_MID_X,
  COACHELLA_STATIC_TOILET_HALF,
  COACHELLA_TOILET_DROP_Y,
} from '../sandiego/constants';
import { coachellaLiveOnTile } from './liveTile';
import type { StageMidBundleModule } from './types';
import { STAGE_TOILET } from '@/lib/stageToilets';

export const bundle = {
  CityTileBody(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <DesertScene tileIndex={props.tileIndex} fitViewport />
        <StageToiletsFlanking
          centerX={COACHELLA_STATIC_STAGE_MID_X}
          stageHalfWidth={COACHELLA_STATIC_TOILET_HALF}
          y={STAGE_TOILET.sidewalkY + COACHELLA_TOILET_DROP_Y}
        />
      </>
    );
  },
  CityTileForeground(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileForeground']>>[0]) {
    return (
      <FestivalStage live={coachellaLiveOnTile(props)} staticViewport />
    );
  },
} satisfies StageMidBundleModule['bundle'];
