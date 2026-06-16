import { forwardRef, memo, useCallback } from 'react';
import {
  cinemaLiveTile,
  coachellaLiveTile,
  concertLiveTile,
  edcLiveTile,
  forestLiveTile,
  silentDiscoLiveTile,
  venueInFocus,
  whichStageLiveTile,
} from '@/lib/venues';
import { worldTileKind } from '@/lib/worldTiles';
import {
  CONCERT_DECK_VIEWBOX_Y,
  CONCERT_HEIGHT,
  CONCERT_SCALE,
  CONCERT_WIDTH,
  CINEMA_HEIGHT,
  CINEMA_SCALE,
  CINEMA_WIDTH,
} from '@/lib/stageVideoLayout';
import { CITY_MID_W, MID_F, midOriginForTile, midWidthForTile, nearMidTiles } from '@/lib/parallax';
import { nearIsolatedMidTiles } from '@/lib/isolatedCity';
import { ParallaxSvgLayer } from './shared/ParallaxSvgLayer';
import { SmallTownTile, SmallTownTerrain } from './town';
import { useStageMidBundle } from './stageBundles/useStageMidBundle';
import type { MidTileRenderProps } from './stageBundles/types';
import type { VenueRoute } from '@/lib/venueRoutes';
import { STAGE_ANCHOR_Y } from '@/lib/stageLayout';

type MidLayerProps = {
  worldOff: number;
  deepLinkRoute?: VenueRoute;
  /** Synced with the main mid layer — festival stages render here, above town cottages. */
  foregroundRef?: React.RefObject<SVGSVGElement | null>;
  /** Farm arch + truss titles — above sky sun/moon, synced with mid scroll. */
  skyLabelsRef?: React.RefObject<SVGSVGElement | null>;
  /** Hide ridge trees on mobile — less clutter + perf. */
  hideTrees?: boolean;
  /** When set, only this city tile is rendered (isolated city mode). */
  isolatedTileIndex?: number;
  /** Custom city skyline for creator-cinema stages. */
  creatorBackdropUrl?: string | null;
};

function tileContentScale(tileIndex: number) {
  return midWidthForTile(tileIndex) / CITY_MID_W;
}

/** Mid parallax: SF → town → Vegas → town → SoCal → town → Tentaroo → town → Forest → town → Seattle → town. */
export const MidLayer = memo(forwardRef<SVGSVGElement, MidLayerProps>(
  function MidLayer({
    worldOff,
    deepLinkRoute,
    foregroundRef,
    skyLabelsRef,
    hideTrees = false,
    isolatedTileIndex,
    creatorBackdropUrl = null,
  }, ref) {
    const vx = worldOff * MID_F;
    const nearTiles = isolatedTileIndex != null
      ? nearIsolatedMidTiles(isolatedTileIndex, deepLinkRoute)
      : nearMidTiles;

    const bundle = useStageMidBundle(
      isolatedTileIndex != null ? deepLinkRoute : undefined,
    );

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

    const tileProps = useCallback((t: number): MidTileRenderProps => ({
      tileIndex: t,
      vx,
      hideTrees,
      deepLinkRoute,
      cinemaLive,
      concertLive,
      coachellaLive,
      edcLive,
      whichStageLive,
      forestLive,
      silentDiscoLive,
      focus,
      cinemaFoW,
      cinemaFoH,
      cinemaFoY,
      concertFoW,
      concertFoH,
      concertFoY,
      creatorBackdropUrl,
    }), [
      vx, hideTrees, deepLinkRoute, cinemaLive, concertLive, coachellaLive,
      edcLive, whichStageLive, forestLive, silentDiscoLive, focus,
      cinemaFoW, cinemaFoH, cinemaFoY, concertFoW, concertFoH, concertFoY,
      creatorBackdropUrl,
    ]);

    const renderTile = useCallback((t: number) => {
      const kind  = worldTileKind(t);
      const w     = midWidthForTile(t);
      const scale = tileContentScale(t);
      const isCityTile = isolatedTileIndex != null && t === isolatedTileIndex;

      return (
        <>
          <g transform={scale === 1 ? undefined : `scale(${scale},1)`}>
            {kind === 'town' && <SmallTownTerrain tileIndex={t} />}
            {isCityTile && bundle && bundle.CityTileBody(tileProps(t))}
          </g>
          {kind === 'town' && <SmallTownTile tileIndex={t} tileWidth={w} hideTrees={hideTrees} />}
          {bundle?.NeighborOverflow?.({ tileIndex: t })}
          <rect x={0} y={0} width={w} height={900} fill="url(#atmo)" />
        </>
      );
    }, [isolatedTileIndex, bundle, tileProps, hideTrees]);

    const renderMidForeground = useCallback((t: number) => {
      if (isolatedTileIndex == null || t !== isolatedTileIndex || !bundle?.CityTileForeground) {
        return null;
      }
      const scale = tileContentScale(t);
      const tf = scale === 1 ? undefined : `scale(${scale},1)`;
      return (
        <g transform={tf}>
          {bundle.CityTileForeground(tileProps(t))}
        </g>
      );
    }, [isolatedTileIndex, bundle, tileProps]);

    const renderMidSkyLabels = useCallback((t: number) => {
      if (isolatedTileIndex == null || t !== isolatedTileIndex || !bundle?.CityTileSkyLabels) {
        return null;
      }
      const scale = tileContentScale(t);
      const tf = scale === 1 ? undefined : `scale(${scale},1)`;
      return (
        <g transform={tf}>
          {bundle.CityTileSkyLabels({ tileIndex: t })}
        </g>
      );
    }, [isolatedTileIndex, bundle]);

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
          style={{ zIndex: 2 }}
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
        {skyLabelsRef && (
          <ParallaxSvgLayer
            ref={skyLabelsRef}
            viewBoxX={vx}
            tileWidth={CITY_MID_W}
            tileOrigin={midOriginForTile}
            nearTileIndices={nearTiles}
            shapeRendering="optimizeSpeed"
            style={{ pointerEvents: 'none', zIndex: 6 }}
          >
            {renderMidSkyLabels}
          </ParallaxSvgLayer>
        )}
      </>
    );
  },
));
