import { SpaceParticlesLayer, CreatorSpaceStageBlock } from '../live';
import { WHICH_STAGE_MID_X } from '../chill/constants';
import { isVenueInView } from '@/lib/venues';
import { SPACE_MID_TILE_W } from '../live/constants';
import { creatorTemplateLiveOnTile } from './liveTile';
import type { StageMidBundleModule } from './types';

const SPACE_VIEW_HALF = SPACE_MID_TILE_W / 2;

export const bundle = {
  CityTileBody(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    const inView = isVenueInView(props.vx, props.tileIndex, WHICH_STAGE_MID_X, SPACE_VIEW_HALF);
    return <SpaceParticlesLayer active={inView} />;
  },
  CityTileForeground(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileForeground']>>[0]) {
    return (
      <CreatorSpaceStageBlock live={creatorTemplateLiveOnTile(props)} />
    );
  },
} satisfies StageMidBundleModule['bundle'];
