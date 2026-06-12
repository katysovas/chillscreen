import { GradientMidTerrain } from '../shared/GradientMidTerrain';
import { TransitionWater } from '../transition';
import { LasVegasSkyline, EDCStage } from '../lasvegas';
import { StageToiletRow } from '../street/StageToiletRow';
import { STAGE_TOILET, stageToiletStartX } from '@/lib/stageToilets';
import { CITY_MID_W } from '@/lib/parallax';
import { isVegasTile } from '@/lib/worldTiles';
import { EDC_STAGE_MID_X, EDC_STAGE_HALF } from '../lasvegas';
import { edcLiveOnTile } from './liveTile';
import type { StageMidBundleModule } from './types';

const EDC_TOILET_RIGHT_OVERFLOW_X =
  stageToiletStartX(EDC_STAGE_MID_X, EDC_STAGE_HALF, 'right') - CITY_MID_W;

export const bundle = {
  CityTileBody(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <GradientMidTerrain tileIndex={props.tileIndex} />
        <TransitionWater tileIndex={props.tileIndex} />
        <LasVegasSkyline />
      </>
    );
  },
  CityTileForeground(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileForeground']>>[0]) {
    return (
      <EDCStage live={edcLiveOnTile(props)} />
    );
  },
  NeighborOverflow({ tileIndex: t }: { tileIndex: number }) {
    if (!isVegasTile(t - 1)) return null;
    return (
      <StageToiletRow startX={EDC_TOILET_RIGHT_OVERFLOW_X} y={STAGE_TOILET.sidewalkY} />
    );
  },
} satisfies StageMidBundleModule['bundle'];
