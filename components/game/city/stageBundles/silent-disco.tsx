import { SilentDiscoTile, SilentDiscoStage, SILENT_DISCO_STAGE_MID_X } from '../silent-disco';
import {
  SILENT_DISCO_BACKDROP_FILL,
  SILENT_DISCO_MID_TILE_H,
  SILENT_DISCO_STATIC_VIEWPORT_W,
  SILENT_DISCO_STATIC_VIEWPORT_X,
  SILENT_DISCO_TOILET_DROP_Y,
} from '../silent-disco/constants';
import { StageToiletsFlanking } from '../street/StageToiletRow';
import { SILENT_DISCO_STAGE_TOILET_HALF } from '../silent-disco/constants';
import { silentDiscoLiveOnTile } from './liveTile';
import type { StageMidBundleModule } from './types';
import { STAGE_TOILET } from '@/lib/stageToilets';

export const bundle = {
  CityTileBody(_props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <rect
          x={SILENT_DISCO_STATIC_VIEWPORT_X}
          y={0}
          width={SILENT_DISCO_STATIC_VIEWPORT_W}
          height={SILENT_DISCO_MID_TILE_H}
          fill={SILENT_DISCO_BACKDROP_FILL}
        />
        <SilentDiscoTile fitViewport />
        <StageToiletsFlanking
          centerX={SILENT_DISCO_STAGE_MID_X}
          stageHalfWidth={SILENT_DISCO_STAGE_TOILET_HALF}
          y={STAGE_TOILET.sidewalkY + SILENT_DISCO_TOILET_DROP_Y}
        />
      </>
    );
  },
  CityTileForeground(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileForeground']>>[0]) {
    return (
      <SilentDiscoStage live={silentDiscoLiveOnTile(props)} staticViewport />
    );
  },
} satisfies StageMidBundleModule['bundle'];
