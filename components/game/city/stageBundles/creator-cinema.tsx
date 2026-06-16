import { CityBackdropLayer, CinemaTrussLabel } from '../cinema';
import { ChillStage } from '../chill';
import { StageToiletsFlanking } from '../street/StageToiletRow';
import { CINEMA_STAGE_MID_X, CINEMA_STAGE_TOILET_HALF } from '../cinema';
import { creatorTemplateLiveOnTile } from './liveTile';
import type { StageMidBundleModule } from './types';

export const bundle = {
  CityTileBody(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <CityBackdropLayer skylineUrl={props.creatorBackdropUrl} />
        <StageToiletsFlanking
          centerX={CINEMA_STAGE_MID_X}
          stageHalfWidth={CINEMA_STAGE_TOILET_HALF}
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
    return <CinemaTrussLabel tile={t} />;
  },
} satisfies StageMidBundleModule['bundle'];
