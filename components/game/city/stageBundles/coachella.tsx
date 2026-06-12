import { GradientMidTerrain } from '../shared/GradientMidTerrain';
import { TransitionWater } from '../transition';
import { SouthernCaliforniaTile } from '../sandiego';
import { FestivalStage } from '../sandiego/FestivalStage';
import { StageToiletRow, StageToiletsBeside } from '../street/StageToiletRow';
import { STAGE_TOILET, stageToiletStartX } from '@/lib/stageToilets';
import { CITY_MID_W } from '@/lib/parallax';
import { isSouthernCaliforniaTile } from '@/lib/worldTiles';
import {
  COACHELLA_STAGE_MID_X,
  COACHELLA_TOILET_LEFT_HALF,
  COACHELLA_TOILET_RIGHT_HALF,
} from '../sandiego/constants';
import { coachellaLiveOnTile } from './liveTile';
import type { StageMidBundleModule } from './types';

const COACHELLA_TOILET_RIGHT_OVERFLOW_X =
  stageToiletStartX(COACHELLA_STAGE_MID_X, COACHELLA_TOILET_RIGHT_HALF, 'right') - CITY_MID_W;

export const bundle = {
  CityTileBody(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <GradientMidTerrain tileIndex={props.tileIndex} />
        <TransitionWater tileIndex={props.tileIndex} />
        <SouthernCaliforniaTile tileIndex={props.tileIndex} />
        <StageToiletsBeside
          centerX={COACHELLA_STAGE_MID_X}
          stageHalfWidth={COACHELLA_TOILET_LEFT_HALF}
          side="left"
        />
      </>
    );
  },
  CityTileForeground(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileForeground']>>[0]) {
    return (
      <FestivalStage live={coachellaLiveOnTile(props)} />
    );
  },
  NeighborOverflow({ tileIndex: t }: { tileIndex: number }) {
    if (!isSouthernCaliforniaTile(t - 1)) return null;
    return (
      <StageToiletRow startX={COACHELLA_TOILET_RIGHT_OVERFLOW_X} y={STAGE_TOILET.sidewalkY} />
    );
  },
} satisfies StageMidBundleModule['bundle'];
