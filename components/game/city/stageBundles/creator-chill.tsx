import { ChillTrussLabel } from '../chill';
import { CreatorChillStage } from './CreatorChillStage';
import { CreatorChillTileBody } from './CreatorChillTileBody';
import type { StageMidBundleModule } from './types';

export const bundle = {
  CityTileBody(_props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return <CreatorChillTileBody />;
  },
  CityTileForeground(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileForeground']>>[0]) {
    return <CreatorChillStage {...props} />;
  },
  CityTileSkyLabels({ tileIndex: t }: { tileIndex: number }) {
    return <ChillTrussLabel tile={t} />;
  },
} satisfies StageMidBundleModule['bundle'];
