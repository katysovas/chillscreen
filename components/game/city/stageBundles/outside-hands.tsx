import { ConcertVenueBlock } from '../cityVenues/ConcertVenueBlock';
import { SfScene } from '../sf/SfScene';
import { SF_CONCERT_MID_X, SF_TOILET_DROP_Y } from '../sf/constants';
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
        />
        <ConcertVenueBlock
          tileIndex={props.tileIndex}
          cinemaLive={props.cinemaLive}
          concertLive={props.concertLive}
          focus={props.focus}
          concertFoW={props.concertFoW}
          concertFoH={props.concertFoH}
          concertFoY={props.concertFoY}
          deepLinkRoute={props.deepLinkRoute}
          centerX={SF_CONCERT_MID_X}
          toiletY={STAGE_TOILET.sidewalkY + SF_TOILET_DROP_Y}
        />
      </>
    );
  },
} satisfies StageMidBundleModule['bundle'];
