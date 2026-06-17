import { ConcertVenueBlock } from '../cityVenues/ConcertVenueBlock';
import { SeattleScene } from '../seattle/SeattleScene';
import { SEATTLE_CONCERT_MID_X, SEATTLE_TOILET_DROP_Y } from '../seattle/constants';
import type { StageMidBundleModule } from './types';
import { STAGE_TOILET } from '@/lib/stageToilets';

export const bundle = {
  CityTileBody(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <SeattleScene tileIndex={props.tileIndex} fitViewport />
        <ConcertVenueBlock
          tileIndex={props.tileIndex}
          cinemaLive={props.cinemaLive}
          concertLive={props.concertLive}
          focus={props.focus}
          concertFoW={props.concertFoW}
          concertFoH={props.concertFoH}
          concertFoY={props.concertFoY}
          deepLinkRoute={props.deepLinkRoute}
          centerX={SEATTLE_CONCERT_MID_X}
          toiletY={STAGE_TOILET.sidewalkY + SEATTLE_TOILET_DROP_Y}
        />
      </>
    );
  },
} satisfies StageMidBundleModule['bundle'];
