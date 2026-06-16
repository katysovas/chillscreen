import { ChillStage, ChillTrussLabel, ChillForestLayer } from '../chill';
import { StageToiletsFlanking } from '../street/StageToiletRow';
import { CHILL_STAGE_MID_X, CHILL_STAGE_TOILET_HALF } from '../chill';
import { creatorTemplateLiveOnTile } from './liveTile';
import type { StageMidBundleModule } from './types';

export const bundle = {
  CityTileBody(_props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <ChillForestLayer />
        <StageToiletsFlanking
          centerX={CHILL_STAGE_MID_X}
          stageHalfWidth={CHILL_STAGE_TOILET_HALF}
        />
      </>
    );
  },
  CityTileForeground(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileForeground']>>[0]) {
    return (
      <ChillStage live={creatorTemplateLiveOnTile(props)} />
    );
  },
  CityTileSkyLabels({ tileIndex: t }: { tileIndex: number }) {
    return <ChillTrussLabel tile={t} />;
  },
} satisfies StageMidBundleModule['bundle'];
