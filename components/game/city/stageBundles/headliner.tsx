import { HeadlinerStage } from './HeadlinerStage';
import { HeadlinerTileBody } from './HeadlinerTileBody';
import type { StageMidBundleModule } from './types';

export const bundle = {
  CityTileBody(_props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return <HeadlinerTileBody />;
  },
  CityTileForeground(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileForeground']>>[0]) {
    return <HeadlinerStage {...props} />;
  },
} satisfies StageMidBundleModule['bundle'];
