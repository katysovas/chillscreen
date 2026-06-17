import { SfScene } from '../sf/SfScene';
import { CinemaVenueBlock } from '../cityVenues/CinemaVenueBlock';
import { CINEMA_STATIC_MID_X, CINEMA_STATIC_VIEWPORT_X, SF_TOILET_DROP_Y } from '../sf/constants';
import type { StageMidBundleModule } from './types';
import { STAGE_TOILET } from '@/lib/stageToilets';

export const bundle = {
  CityTileBody(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <SfScene
          tileIndex={props.tileIndex}
          fitViewport
          hideTrees={props.hideTrees}
          viewportX={CINEMA_STATIC_VIEWPORT_X}
        />
        <CinemaVenueBlock
          tileIndex={props.tileIndex}
          cinemaLive={props.cinemaLive}
          concertLive={props.concertLive}
          focus={props.focus}
          cinemaFoW={props.cinemaFoW}
          cinemaFoH={props.cinemaFoH}
          cinemaFoY={props.cinemaFoY}
          deepLinkRoute={props.deepLinkRoute}
          centerX={CINEMA_STATIC_MID_X}
          toiletY={STAGE_TOILET.sidewalkY + SF_TOILET_DROP_Y}
        />
      </>
    );
  },
} satisfies StageMidBundleModule['bundle'];
