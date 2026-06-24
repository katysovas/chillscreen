import { TransitionWater } from '../transition';
import { OrbitMidTile } from '../orbit';
import { DeepSpaceVenueBlock } from '../cityVenues/DeepSpaceVenueBlock';
import type { StageMidBundleModule } from './types';

export const bundle = {
  CityTileBody(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <TransitionWater tileIndex={props.tileIndex} />
        <OrbitMidTile />
        <DeepSpaceVenueBlock
          tileIndex={props.tileIndex}
          cinemaLive={props.cinemaLive}
          concertLive={props.concertLive}
          focus={props.focus}
          deepLinkRoute={props.deepLinkRoute}
          desktopStageOverlay={props.desktopStageOverlay}
        />
      </>
    );
  },
} satisfies StageMidBundleModule['bundle'];
