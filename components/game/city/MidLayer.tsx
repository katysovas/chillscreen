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
import { CITY_MID_W, MID_F, midOriginForTile, midWidthForTile } from '@/lib/parallax';
import { nearIsolatedMidTiles } from '@/lib/isolatedCity';
import { isCreatorTemplateRoute } from '@/lib/venueSlugs';
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
  /**
   * Desktop in-game mode: pass `worldOff * MID_F` here to use a zero-origin
   * viewBox (`0 0 1400 900`) with an SVG `<g transform>` for the x-offset
   * instead of encoding the offset in the viewBox `x` attribute.
   * This avoids a Safari WebKit bug where the viewBox x-origin is silently
   * ignored, shifting stage content to the right side of the screen.
   * Leave undefined for mobile / landing-hero modes (they use their own viewBoxes).
   */
  contentTranslateX?: number;
  /**
   * When true, stage `foreignObject` content is omitted from the SVG tiles.
   * The caller renders the Deep Space stage as a CSS-positioned HTML overlay
   * that is completely independent of the SVG coordinate system.
   */
  stageOverlay?: boolean;
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
    contentTranslateX,
    stageOverlay = false,
  }, ref) {
    const vx = worldOff * MID_F;
    const nearTiles = nearIsolatedMidTiles(isolatedTileIndex!, deepLinkRoute);

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
      desktopStageOverlay: stageOverlay,
    }), [
      vx, hideTrees, deepLinkRoute, cinemaLive, concertLive, coachellaLive,
      edcLive, whichStageLive, forestLive, silentDiscoLive, focus,
      cinemaFoW, cinemaFoH, cinemaFoY, concertFoW, concertFoH, concertFoY,
      creatorBackdropUrl, stageOverlay,
    ]);

    const renderTile = useCallback((t: number) => {
      const kind  = worldTileKind(t);
      const w     = midWidthForTile(t);
      const scale = tileContentScale(t);
      const isCityTile = isolatedTileIndex != null && t === isolatedTileIndex;
      const skipAtmo = isCityTile && deepLinkRoute != null && isCreatorTemplateRoute(deepLinkRoute);

      return (
        <>
          <g transform={scale === 1 ? undefined : `scale(${scale},1)`}>
            {kind === 'town' && <SmallTownTerrain tileIndex={t} />}
            {isCityTile && bundle && bundle.CityTileBody(tileProps(t))}
          </g>
          {kind === 'town' && <SmallTownTile tileIndex={t} tileWidth={w} hideTrees={hideTrees} />}
          {bundle?.NeighborOverflow?.({ tileIndex: t })}
          {!skipAtmo && <rect x={0} y={0} width={w} height={900} fill="url(#atmo)" />}
        </>
      );
    }, [isolatedTileIndex, bundle, tileProps, hideTrees, deepLinkRoute]);

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
          parallaxLayer="stage"
          style={{ zIndex: 2 }}
          contentTranslateX={contentTranslateX}
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
            parallaxLayer="stage"
            style={{ pointerEvents: 'none', zIndex: 4 }}
            contentTranslateX={contentTranslateX}
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
            parallaxLayer="stage"
            style={{ pointerEvents: 'none', zIndex: 6 }}
            contentTranslateX={contentTranslateX}
          >
            {renderMidSkyLabels}
          </ParallaxSvgLayer>
        )}
      </>
    );
  },
));
