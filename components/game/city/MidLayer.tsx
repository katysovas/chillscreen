import { forwardRef, memo, useCallback } from 'react';
import { CINEMA_SCALE, CINEMA_HEIGHT, CINEMA_WIDTH } from '../Cinema';
import { CONCERT_DECK_VIEWBOX_Y, CONCERT_SCALE, CONCERT_HEIGHT, CONCERT_WIDTH } from '../Concert';
import {
  cinemaLiveTile,
  coachellaLiveTile,
  concertLiveTile,
  edcLiveTile,
  forestLiveTile,
  forestStageMidX,
  isVenueInView,
  silentDiscoLiveTile,
  silentDiscoStageMidX,
  venueInFocus,
  whichStageLiveTile,
  whichStageMidX,
} from '@/lib/venues';
import { isForestTile, isSilentDiscoTile, isSouthernCaliforniaTile, isTentarooTile, isVegasTile, worldTileKind } from '@/lib/worldTiles';
import { WHICH_STAGE_HALF, WHICH_STAGE_TOILET_HALF } from './tentaroo/constants';
import { FOREST_STAGE_HALF, FOREST_STAGE_TOILET_HALF } from './forest/constants';
import { SILENT_DISCO_STAGE_HALF, SILENT_DISCO_STAGE_TOILET_HALF } from './silent-disco/constants';
import {
  COACHELLA_STAGE_MID_X,
  COACHELLA_TOILET_LEFT_HALF,
  COACHELLA_TOILET_RIGHT_HALF,
} from './sandiego/constants';
import { StageToiletRow, StageToiletsBeside, StageToiletsFlanking } from './street/StageToiletRow';
import { STAGE_TOILET, stageToiletStartX } from '@/lib/stageToilets';
import { CITY_MID_W, MID_F, midOriginForTile, midWidthForTile, nearMidTiles } from '@/lib/parallax';
import { nearIsolatedMidTiles } from '@/lib/isolatedCity';
import { ParallaxSvgLayer } from './shared/ParallaxSvgLayer';
import { GradientMidTerrain } from './shared/GradientMidTerrain';
import { CityBuildingsTile } from './buildings/CityBuildingsTile';
import { CityVenuesTile } from './CityVenuesLayer';
import { MidBushes } from './MidBushes';
import { SfMidFeatures } from './SfMidFeatures';
import { SeattleBuildingsTile, SeattleMidFeatures } from './seattle';
import { TentarooTile, WhichStage } from './tentaroo';
import { ForestTile, ForestStage, FOREST_STAGE_MID_X } from './forest';
import { SilentDiscoTile, SilentDiscoStage, SILENT_DISCO_STAGE_MID_X } from './silent-disco';
import { SouthernCaliforniaTile } from './sandiego';
import { EDCStage, LasVegasSkyline, EDC_STAGE_MID_X, EDC_STAGE_HALF } from './lasvegas';
import { WHICH_STAGE_MID_X } from './tentaroo';
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
  /** Hide ridge trees on mobile — less clutter + perf. */
  hideTrees?: boolean;
  /** When set, only this city tile is rendered (isolated city mode). */
  isolatedTileIndex?: number;
};

function tileContentScale(tileIndex: number) {
  return midWidthForTile(tileIndex) / CITY_MID_W;
}

// The Vegas and Coachella stages are scaled wider than their 2600px tile, so
// their right-hand toilet rows land past the tile edge. Those rows render on
// the NEXT tile (at the overflow offset) so the neighbour's art doesn't cover them.
const EDC_TOILET_RIGHT_OVERFLOW_X =
  stageToiletStartX(EDC_STAGE_MID_X, EDC_STAGE_HALF, 'right') - CITY_MID_W;
const COACHELLA_TOILET_RIGHT_OVERFLOW_X =
  stageToiletStartX(COACHELLA_STAGE_MID_X, COACHELLA_TOILET_RIGHT_HALF, 'right') - CITY_MID_W;

function edcLiveOnTile(
  t: number,
  cinemaLive: number,
  concertLive: number,
  coachellaLive: number,
  edcLive: number,
  whichStageLive: number,
  forestLive: number,
  silentDiscoLive: number,
  focus: ReturnType<typeof venueInFocus>,
  deepLinkRoute?: VenueRoute,
) {
  return isVenueLive(
    'edc', t, cinemaLive, concertLive, coachellaLive, edcLive, whichStageLive, forestLive, silentDiscoLive, focus, deepLinkRoute,
  );
}

function coachellaLiveOnTile(
  t: number,
  cinemaLive: number,
  concertLive: number,
  coachellaLive: number,
  edcLive: number,
  whichStageLive: number,
  forestLive: number,
  silentDiscoLive: number,
  focus: ReturnType<typeof venueInFocus>,
  deepLinkRoute?: VenueRoute,
) {
  return isVenueLive(
    'coachella', t, cinemaLive, concertLive, coachellaLive, edcLive, whichStageLive, forestLive, silentDiscoLive, focus, deepLinkRoute,
  );
}

function whichStageLiveOnTile(
  t: number,
  vx: number,
  cinemaLive: number,
  concertLive: number,
  coachellaLive: number,
  edcLive: number,
  whichStageLive: number,
  forestLive: number,
  silentDiscoLive: number,
  focus: ReturnType<typeof venueInFocus>,
  deepLinkRoute?: VenueRoute,
) {
  if (!isTentarooTile(t)) return false;
  const midX = whichStageMidX(t);
  if (midX != null && isVenueInView(vx, t, midX, WHICH_STAGE_HALF)) {
    return true;
  }
  return isVenueLive(
    'which-stage', t, cinemaLive, concertLive, coachellaLive, edcLive, whichStageLive, forestLive, silentDiscoLive, focus, deepLinkRoute,
  );
}

function forestLiveOnTile(
  t: number,
  vx: number,
  cinemaLive: number,
  concertLive: number,
  coachellaLive: number,
  edcLive: number,
  whichStageLive: number,
  forestLive: number,
  silentDiscoLive: number,
  focus: ReturnType<typeof venueInFocus>,
  deepLinkRoute?: VenueRoute,
) {
  if (!isForestTile(t)) return false;
  const midX = forestStageMidX(t);
  if (midX != null && isVenueInView(vx, t, midX, FOREST_STAGE_HALF)) {
    return true;
  }
  return isVenueLive(
    'forest', t, cinemaLive, concertLive, coachellaLive, edcLive, whichStageLive, forestLive, silentDiscoLive, focus, deepLinkRoute,
  );
}

function silentDiscoLiveOnTile(
  t: number,
  vx: number,
  cinemaLive: number,
  concertLive: number,
  coachellaLive: number,
  edcLive: number,
  whichStageLive: number,
  forestLive: number,
  silentDiscoLive: number,
  focus: ReturnType<typeof venueInFocus>,
  deepLinkRoute?: VenueRoute,
) {
  if (!isSilentDiscoTile(t)) return false;
  const midX = silentDiscoStageMidX(t);
  if (midX != null && isVenueInView(vx, t, midX, SILENT_DISCO_STAGE_HALF)) {
    return true;
  }
  return isVenueLive(
    'silent-disco', t, cinemaLive, concertLive, coachellaLive, edcLive, whichStageLive, forestLive, silentDiscoLive, focus, deepLinkRoute,
  );
}

/** Mid parallax: SF → town → Vegas → town → SoCal → town → Tentaroo → town → Forest → town → Seattle → town. */
export const MidLayer = memo(forwardRef<SVGSVGElement, MidLayerProps>(
  function MidLayer({ worldOff, deepLinkRoute, foregroundRef, hideTrees = false, isolatedTileIndex }, ref) {
    const vx = worldOff * MID_F;
    const nearTiles = isolatedTileIndex != null
      ? nearIsolatedMidTiles(isolatedTileIndex)
      : nearMidTiles;

    const cinemaLive   = cinemaLiveTile(vx);
    const concertLive  = concertLiveTile(vx);
    const coachellaLive = coachellaLiveTile(vx);
    const edcLive     = edcLiveTile(vx);
    const whichStageLive = whichStageLiveTile(vx);
    const forestLive  = forestLiveTile(vx);
    const silentDiscoLive = silentDiscoLiveTile(vx);
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
                {!hideTrees && <MidBushes />}
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
            {/* Toilets live on the tile (not the stage component) so they slide in
                from the screen edge ahead of the foreground stage. */}
            {/* Vegas: no left-side toilets (right row renders on the next tile below). */}
            {kind === 'vegas' && <LasVegasSkyline />}
            {isSouthernCaliforniaTile(t) && (
              <>
                <SouthernCaliforniaTile tileIndex={t} />
                {/* Right row overflows the tile — rendered on the next tile below. */}
                <StageToiletsBeside
                  centerX={COACHELLA_STAGE_MID_X}
                  stageHalfWidth={COACHELLA_TOILET_LEFT_HALF}
                  side="left"
                />
              </>
            )}
            {isTentarooTile(t) && (
              <>
                <TentarooTile />
                <StageToiletsFlanking
                  centerX={WHICH_STAGE_MID_X}
                  stageHalfWidth={WHICH_STAGE_TOILET_HALF}
                />
              </>
            )}
            {isForestTile(t) && (
              <>
                <ForestTile />
                <StageToiletsFlanking
                  centerX={FOREST_STAGE_MID_X}
                  stageHalfWidth={FOREST_STAGE_TOILET_HALF}
                />
              </>
            )}
            {isSilentDiscoTile(t) && (
              <>
                <SilentDiscoTile />
                <StageToiletsFlanking
                  centerX={SILENT_DISCO_STAGE_MID_X}
                  stageHalfWidth={SILENT_DISCO_STAGE_TOILET_HALF}
                />
              </>
            )}
          </g>
          {kind === 'town' && <SmallTownTile tileIndex={t} tileWidth={w} hideTrees={hideTrees} />}
          {/* Right-side toilet rows of oversized neighbour stages (unscaled coords,
              outside the town squeeze transform). */}
          {isVegasTile(t - 1) && (
            <StageToiletRow startX={EDC_TOILET_RIGHT_OVERFLOW_X} y={STAGE_TOILET.sidewalkY} />
          )}
          {isSouthernCaliforniaTile(t - 1) && (
            <StageToiletRow startX={COACHELLA_TOILET_RIGHT_OVERFLOW_X} y={STAGE_TOILET.sidewalkY} />
          )}
          <rect x={0} y={0} width={w} height={900} fill="url(#atmo)" />
        </>
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cinemaLive, concertLive, coachellaLive, edcLive, whichStageLive, forestLive, silentDiscoLive, focus, deepLinkRoute, hideTrees]);

    const renderMidForeground = useCallback((t: number) => {
      const scale = tileContentScale(t);
      const tf = scale === 1 ? undefined : `scale(${scale},1)`;

      if (isVegasTile(t)) {
        return (
          <g transform={tf}>
            <EDCStage live={edcLiveOnTile(t, cinemaLive, concertLive, coachellaLive, edcLive, whichStageLive, forestLive, silentDiscoLive, focus, deepLinkRoute)} />
          </g>
        );
      }
      if (isSouthernCaliforniaTile(t)) {
        return (
          <g transform={tf}>
            <FestivalStage live={coachellaLiveOnTile(t, cinemaLive, concertLive, coachellaLive, edcLive, whichStageLive, forestLive, silentDiscoLive, focus, deepLinkRoute)} />
          </g>
        );
      }
      if (isTentarooTile(t)) {
        return (
          <g transform={tf}>
            <WhichStage live={whichStageLiveOnTile(t, vx, cinemaLive, concertLive, coachellaLive, edcLive, whichStageLive, forestLive, silentDiscoLive, focus, deepLinkRoute)} />
          </g>
        );
      }
      if (isForestTile(t)) {
        return (
          <g transform={tf}>
            <ForestStage live={forestLiveOnTile(t, vx, cinemaLive, concertLive, coachellaLive, edcLive, whichStageLive, forestLive, silentDiscoLive, focus, deepLinkRoute)} />
          </g>
        );
      }
      if (isSilentDiscoTile(t)) {
        return (
          <g transform={tf}>
            <SilentDiscoStage live={silentDiscoLiveOnTile(t, vx, cinemaLive, concertLive, coachellaLive, edcLive, whichStageLive, forestLive, silentDiscoLive, focus, deepLinkRoute)} />
          </g>
        );
      }
      return null;
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cinemaLive, concertLive, coachellaLive, edcLive, whichStageLive, forestLive, silentDiscoLive, focus, deepLinkRoute]);

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
          nearTileIndices={nearTiles}
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
            nearTileIndices={nearTiles}
            shapeRendering="optimizeSpeed"
            style={{ pointerEvents: 'none', zIndex: 4 }}
          >
            {renderMidForeground}
          </ParallaxSvgLayer>
        )}
      </>
    );
  },
));
