import { CityBackdropLayer, CinemaStage, CinemaTrussLabel } from '../cinema';
import { CITY_BACKDROP_FILL, CITY_MID_TILE_H, CITY_MID_TILE_W } from '../cinema/constants';
import { StageToiletsFlanking } from '../street/StageToiletRow';
import { CINEMA_STAGE_MID_X, CINEMA_STAGE_TOILET_HALF } from '../cinema';
import { creatorTemplateLiveOnTile } from './liveTile';
import type { StageMidBundleModule } from './types';

export const bundle = {
  CityTileBody(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        {/* Base fill covers the bleed area on each side (154px exposed when
            character walks to the nav-sign positions). */}
        <rect x={-200} y={0} width={CITY_MID_TILE_W + 400} height={CITY_MID_TILE_H} fill={CITY_BACKDROP_FILL} />
        {/* Backdrop image extends 200px past each tile edge via bleedPx so the
            image, not the fill colour, is visible at walk extremes. */}
        <CityBackdropLayer skylineUrl={props.creatorBackdropUrl} bleedPx={200} />
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
