import { VegasScene } from '../lasvegas/VegasScene';
import { EDCStage } from '../lasvegas';
import { StageToiletsFlanking } from '../street/StageToiletRow';
import {
  EDC_STATIC_STAGE_HALF,
  EDC_STATIC_STAGE_MID_X,
  EDC_STATIC_STAGE_SCALE,
  VEGAS_TOILET_DROP_Y,
} from '../lasvegas/constants';
import { edcLiveOnTile } from './liveTile';
import type { StageMidBundleModule } from './types';
import { STAGE_TOILET } from '@/lib/stageToilets';

export const bundle = {
  CityTileBody(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <VegasScene tileIndex={props.tileIndex} fitViewport />
        <EDCStage
          live={edcLiveOnTile(props)}
          midX={EDC_STATIC_STAGE_MID_X}
          scale={EDC_STATIC_STAGE_SCALE}
        />
        <StageToiletsFlanking
          centerX={EDC_STATIC_STAGE_MID_X}
          stageHalfWidth={EDC_STATIC_STAGE_HALF}
          y={STAGE_TOILET.sidewalkY + VEGAS_TOILET_DROP_Y}
        />
      </>
    );
  },
} satisfies StageMidBundleModule['bundle'];
