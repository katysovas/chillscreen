import { CityBackdropLayer, CinemaStage, CinemaTrussLabel } from '../cinema';
import { StageToiletsFlanking } from '../street/StageToiletRow';
import { CINEMA_STAGE_MID_X, CINEMA_STAGE_TOILET_HALF } from '../cinema';
import { creatorTemplateLiveOnTile } from './liveTile';
import type { StageMidBundleModule } from './types';

export const bundle = {
  CityTileBody(_props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <CityBackdropLayer />
        <StageToiletsFlanking
          centerX={CINEMA_STAGE_MID_X}
          stageHalfWidth={CINEMA_STAGE_TOILET_HALF}
        />
      </>
    );
  },
  CityTileForeground(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileForeground']>>[0]) {
    return (
      <CinemaStage live={creatorTemplateLiveOnTile(props)} />
    );
  },
  CityTileSkyLabels({ tileIndex: t }: { tileIndex: number }) {
    return <CinemaTrussLabel tile={t} />;
  },
} satisfies StageMidBundleModule['bundle'];
