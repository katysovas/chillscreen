import { GradientMidTerrain } from '../shared/GradientMidTerrain';
import { TransitionWater } from '../transition';
import { SeattleBuildingsTile, SeattleMidFeatures } from '../seattle';
import { ConcertVenueBlock } from '../cityVenues/ConcertVenueBlock';
import type { StageMidBundleModule } from './types';

export const bundle = {
  CityTileBody(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <GradientMidTerrain tileIndex={props.tileIndex} />
        <TransitionWater tileIndex={props.tileIndex} />
        <SeattleMidFeatures tileIndex={props.tileIndex} />
        <SeattleBuildingsTile />
        <ConcertVenueBlock
          tileIndex={props.tileIndex}
          cinemaLive={props.cinemaLive}
          concertLive={props.concertLive}
          focus={props.focus}
          concertFoW={props.concertFoW}
          concertFoH={props.concertFoH}
          concertFoY={props.concertFoY}
          deepLinkRoute={props.deepLinkRoute}
        />
      </>
    );
  },
} satisfies StageMidBundleModule['bundle'];
