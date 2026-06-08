import { forwardRef, memo, useCallback } from 'react';
import { CINEMA_SCALE, CINEMA_HEIGHT, CINEMA_WIDTH } from '../Cinema';
import { CONCERT_DECK_VIEWBOX_Y, CONCERT_SCALE, CONCERT_HEIGHT, CONCERT_WIDTH } from '../Concert';
import {
  cinemaLiveTile,
  coachellaLiveTile,
  concertLiveTile,
  edcLiveTile,
  venueInFocus,
} from '@/lib/venues';
import { isSouthernCaliforniaTile, isVegasTile, worldTileKind } from '@/lib/worldTiles';
import { CITY_MID_W, MID_F, midOriginForTile, midWidthForTile, nearMidTiles } from '@/lib/parallax';
import { ParallaxSvgLayer } from './shared/ParallaxSvgLayer';
import { GradientMidTerrain } from './shared/GradientMidTerrain';
import { CityBuildingsTile } from './buildings/CityBuildingsTile';
import { CityVenuesTile } from './CityVenuesLayer';
import { MidBushes } from './MidBushes';
import { SfMidFeatures } from './SfMidFeatures';
import { SeattleBuildingsTile, SeattleMidFeatures } from './seattle';
import { SouthernCaliforniaTile } from './sandiego';
import { EDCStage, LasVegasSkyline } from './lasvegas';
import { FestivalStage } from './sandiego/FestivalStage';
import { SmallTownTile, SmallTownTerrain } from './town';
import { TransitionWater } from './transition';
import type { VenueRoute } from '@/lib/venueRoutes';
import { isVenueLive } from '@/lib/venueRoutes';
import { STAGE_ANCHOR_Y } from '@/lib/stageLayout';

type MidLayerProps = {
  worldOff: number;
  deepLinkRoute?: VenueRoute;
  /** Synced with the main mid layer — festival stages render here, above town cottages. */
  foregroundRef?: React.RefObject<SVGSVGElement | null>;
};

function tileContentScale(tileIndex: number) {
  return midWidthForTile(tileIndex) / CITY_MID_W;
}

function edcLiveOnTile(
  t: number,
  cinemaLive: number,
  concertLive: number,
  coachellaLive: number,
  edcLive: number,
  focus: ReturnType<typeof venueInFocus>,
  deepLinkRoute?: VenueRoute,
) {
  return isVenueLive(
    'edc', t, cinemaLive, concertLive, coachellaLive, edcLive, focus, deepLinkRoute,
  );
}

function coachellaLiveOnTile(
  t: number,
  cinemaLive: number,
  concertLive: number,
  coachellaLive: number,
  edcLive: number,
  focus: ReturnType<typeof venueInFocus>,
  deepLinkRoute?: VenueRoute,
) {
  return isVenueLive(
    'coachella', t, cinemaLive, concertLive, coachellaLive, edcLive, focus, deepLinkRoute,
  );
}

/** Mid parallax: SF → town → Vegas → town → San Diego+Coachella → town → Seattle → town. */
export const MidLayer = memo(forwardRef<SVGSVGElement, MidLayerProps>(
  function MidLayer({ worldOff, deepLinkRoute, foregroundRef }, ref) {
    const vx = worldOff * MID_F;

    const cinemaLive   = cinemaLiveTile(vx);
    const concertLive  = concertLiveTile(vx);
    const coachellaLive = coachellaLiveTile(vx);
    const edcLive     = edcLiveTile(vx);
    const focus        = venueInFocus(vx);

    const stageGroundY = STAGE_ANCHOR_Y;
    const cinemaFoW  = CINEMA_WIDTH * CINEMA_SCALE;
    const cinemaFoH  = CINEMA_HEIGHT * CINEMA_SCALE;
    const cinemaFoY  = stageGroundY - cinemaFoH;
    const concertFoW = CONCERT_WIDTH * CONCERT_SCALE;
    const concertFoH = CONCERT_HEIGHT * CONCERT_SCALE;
    const concertFoY = stageGroundY - CONCERT_DECK_VIEWBOX_Y * CONCERT_SCALE;

    const renderTile = useCallback((t: number) => {
      const kind  = worldTileKind(t);
      const w     = midWidthForTile(t);
      const scale = tileContentScale(t);

      return (
        <>
          <g transform={scale === 1 ? undefined : `scale(${scale},1)`}>
            <GradientMidTerrain tileIndex={t} />
            <TransitionWater tileIndex={t} />
            {kind === 'town' && <SmallTownTerrain tileIndex={t} />}
            {kind === 'seattle' && <SeattleMidFeatures tileIndex={t} />}
            {kind === 'seattle' && <SeattleBuildingsTile />}
            {kind === 'sf' && (
              <>
                <CityBuildingsTile />
                <MidBushes />
                <SfMidFeatures />
              </>
            )}
            {(kind === 'sf' || kind === 'seattle') && (
              <CityVenuesTile
                tileIndex={t}
                cinemaLive={cinemaLive}
                concertLive={concertLive}
                focus={focus}
                cinemaFoW={cinemaFoW}
                cinemaFoH={cinemaFoH}
                cinemaFoY={cinemaFoY}
                concertFoW={concertFoW}
                concertFoH={concertFoH}
                concertFoY={concertFoY}
                deepLinkRoute={deepLinkRoute}
              />
            )}
            {kind === 'vegas' && <LasVegasSkyline />}
            {isSouthernCaliforniaTile(t) && (
              <SouthernCaliforniaTile tileIndex={t} />
            )}
          </g>
          {kind === 'town' && <SmallTownTile tileIndex={t} tileWidth={w} />}
          <rect x={0} y={0} width={w} height={900} fill="url(#atmo)" />
        </>
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cinemaLive, concertLive, coachellaLive, edcLive, focus, deepLinkRoute]);

    const renderMidForeground = useCallback((t: number) => {
      const scale = tileContentScale(t);
      const tf = scale === 1 ? undefined : `scale(${scale},1)`;

      if (isVegasTile(t)) {
        return (
          <g transform={tf}>
            <EDCStage live={edcLiveOnTile(t, cinemaLive, concertLive, coachellaLive, edcLive, focus, deepLinkRoute)} />
          </g>
        );
      }
      if (isSouthernCaliforniaTile(t)) {
        return (
          <g transform={tf}>
            <FestivalStage live={coachellaLiveOnTile(t, cinemaLive, concertLive, coachellaLive, edcLive, focus, deepLinkRoute)} />
          </g>
        );
      }
      return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cinemaLive, concertLive, coachellaLive, edcLive, focus, deepLinkRoute]);

    const atmoDefs = (
      <defs>
        <linearGradient id="atmo" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(180,205,235,0)" />
          <stop offset="100%" stopColor="rgba(180,205,235,.18)" />
        </linearGradient>
      </defs>
    );

    return (
      <>
        <ParallaxSvgLayer
          ref={ref}
          viewBoxX={vx}
          tileWidth={CITY_MID_W}
          tileOrigin={midOriginForTile}
          nearTileIndices={nearMidTiles}
          defs={atmoDefs}
          shapeRendering="optimizeSpeed"
        >
          {renderTile}
        </ParallaxSvgLayer>
        {foregroundRef && (
          <ParallaxSvgLayer
            ref={foregroundRef}
            viewBoxX={vx}
            tileWidth={CITY_MID_W}
            tileOrigin={midOriginForTile}
            nearTileIndices={nearMidTiles}
            shapeRendering="optimizeSpeed"
            style={{ pointerEvents: 'none' }}
          >
            {renderMidForeground}
          </ParallaxSvgLayer>
        )}
      </>
    );
  },
));
