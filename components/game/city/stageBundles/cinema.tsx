import { GradientMidTerrain } from '../shared/GradientMidTerrain';
import { TransitionWater } from '../transition';
import { CityBuildingsTile } from '../buildings/CityBuildingsTile';
import { MidBushes } from '../MidBushes';
import { SfMidFeatures } from '../SfMidFeatures';
import { CinemaVenueBlock } from '../cityVenues/CinemaVenueBlock';
import type { StageMidBundleModule } from './types';

export const bundle = {
  CityTileBody(props: Parameters<NonNullable<StageMidBundleModule['bundle']['CityTileBody']>>[0]) {
    return (
      <>
        <GradientMidTerrain tileIndex={props.tileIndex} />
        <TransitionWater tileIndex={props.tileIndex} />
        <CityBuildingsTile />
        {!props.hideTrees && <MidBushes />}
        <SfMidFeatures />
        <CinemaVenueBlock
          tileIndex={props.tileIndex}
          cinemaLive={props.cinemaLive}
          concertLive={props.concertLive}
          focus={props.focus}
          cinemaFoW={props.cinemaFoW}
          cinemaFoH={props.cinemaFoH}
          cinemaFoY={props.cinemaFoY}
          deepLinkRoute={props.deepLinkRoute}
        />
      </>
    );
  },
} satisfies StageMidBundleModule['bundle'];
