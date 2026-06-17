import { CityBackdropLayer, CinemaStage, CinemaTrussLabel } from '../cinema';
import {
  CITY_BACKDROP_FILL,
  CITY_MID_TILE_H,
  CITY_STATIC_VIEWPORT_W,
  CITY_STATIC_VIEWPORT_X,
  CITY_TOILET_DROP_Y,
} from '../cinema/constants';
import { StageToiletsFlanking } from '../street/StageToiletRow';
import { CINEMA_STAGE_MID_X, CINEMA_STAGE_TOILET_HALF } from '../cinema';
import { creatorTemplateLiveOnTile } from './liveTile';
import type { StageMidBundleModule } from './types';
import { STAGE_TOILET } from '@/lib/stageToilets';

export const bundle = {
  CityTileBody(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <rect
          x={CITY_STATIC_VIEWPORT_X}
          y={0}
          width={CITY_STATIC_VIEWPORT_W}
          height={CITY_MID_TILE_H}
          fill={CITY_BACKDROP_FILL}
        />
        <CityBackdropLayer skylineUrl={props.creatorBackdropUrl} fitViewport />
        <StageToiletsFlanking
          centerX={CINEMA_STAGE_MID_X}
          stageHalfWidth={CINEMA_STAGE_TOILET_HALF}
          y={STAGE_TOILET.sidewalkY + CITY_TOILET_DROP_Y}
        />
      </>
    );
  },
  CityTileForeground(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileForeground']>>[0]) {
    return (
      <CinemaStage live={creatorTemplateLiveOnTile(props)} playbackRoute={props.deepLinkRoute} />
    );
  },
  CityTileSkyLabels({ tileIndex: t }: { tileIndex: number }) {
    return <CinemaTrussLabel tile={t} />;
  },
} satisfies StageMidBundleModule['bundle'];
