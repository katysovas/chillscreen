import { forwardRef, memo, useCallback } from 'react';
import { CINEMA_SCALE, CINEMA_HEIGHT, CINEMA_WIDTH } from '../Cinema';
import { CONCERT_SCALE, CONCERT_HEIGHT, CONCERT_WIDTH } from '../Concert';
import {
  coachellaMidX,
  cinemaLiveTile,
  coachellaLiveTile,
  concertLiveTile,
  isVenueInView,
  venueInFocus,
} from '@/lib/venues';
import { COACHELLA_STAGE_HALF } from './sandiego/constants';
import { isSouthernCaliforniaTile, worldTileKind } from '@/lib/worldTiles';
import { CITY_MID_W, MID_F, midOriginForTile, midWidthForTile, nearMidTiles } from '@/lib/parallax';
import { ParallaxSvgLayer } from './shared/ParallaxSvgLayer';
import { GradientMidTerrain } from './shared/GradientMidTerrain';
import { CityBuildingsTile } from './buildings/CityBuildingsTile';
import { CityVenuesTile } from './CityVenuesLayer';
import { MidBushes } from './MidBushes';
import { SfMidFeatures } from './SfMidFeatures';
import { SeattleBuildingsTile, SeattleMidFeatures } from './seattle';
import { SouthernCaliforniaTile } from './sandiego';
import { SmallTownTile } from './town';
import { TransitionWater } from './transition';

type MidLayerProps = {
  worldOff: number;
};

function tileContentScale(tileIndex: number) {
  return midWidthForTile(tileIndex) / CITY_MID_W;
}

/** Mid parallax: SF → short town → San Diego+Coachella → short town → Seattle → short town. */
export const MidLayer = memo(forwardRef<SVGSVGElement, MidLayerProps>(
  function MidLayer({ worldOff }, ref) {
    const vx = worldOff * MID_F;

    // Venue-focus values — change only when the player walks into/out of a venue.
    const cinemaLive   = cinemaLiveTile(vx);
    const concertLive  = concertLiveTile(vx);
    const coachellaLive = coachellaLiveTile(vx);
    const focus        = venueInFocus(vx);

    // Derived Cinema/Concert geometry (stable across scrolling, changes only on
    // code updates — keep outside the callback to avoid dep churn).
    const cinemaFoW  = CINEMA_WIDTH * CINEMA_SCALE;
    const cinemaFoH  = CINEMA_HEIGHT * CINEMA_SCALE;
    const cinemaFoY  = 670 - cinemaFoH;
    const cinemaHalf = Math.ceil(cinemaFoW / 2) + 24;
    const concertFoW = CONCERT_WIDTH * CONCERT_SCALE;
    const concertFoH = CONCERT_HEIGHT * CONCERT_SCALE;
    const concertFoY = 670 - concertFoH;
    const concertHalf = Math.ceil(concertFoW / 2) + 24;

    // Render callback is only recreated when venue-focus state changes.
    // vx is intentionally omitted: isVenueInView is a secondary pixel check —
    // a slightly stale vx value is imperceptible and keeps 2 of 3 tiles stable.
    const renderTile = useCallback((t: number) => {
      const kind  = worldTileKind(t);
      const w     = midWidthForTile(t);
      const scale = tileContentScale(t);

      return (
        <>
          <g transform={scale === 1 ? undefined : `scale(${scale},1)`}>
            <GradientMidTerrain tileIndex={t} />
            <TransitionWater tileIndex={t} />
            {kind === 'seattle' && <SeattleMidFeatures tileIndex={t} />}
            {/* City buildings must render BEFORE the venues so the stage sits in
                front of the skyline (Seattle's tall glass towers were covering it). */}
            {kind === 'seattle' && <SeattleBuildingsTile />}
            {kind === 'sf' && (
              <>
                <CityBuildingsTile />
                <MidBushes />
                <SfMidFeatures />
              </>
            )}
            {/* Concert stage on every stage city (SF "Outside Hands", Seattle
                "Bumbleshoot") + cinema on SF. concertMidX/cinemaMidX return null
                for tiles they don't own, so this is safe for all kinds. */}
            {(kind === 'sf' || kind === 'seattle') && (
              <CityVenuesTile
                tileIndex={t}
                vx={vx}
                cinemaLive={cinemaLive}
                concertLive={concertLive}
                focus={focus}
                cinemaHalf={cinemaHalf}
                concertHalf={concertHalf}
                cinemaFoW={cinemaFoW}
                cinemaFoH={cinemaFoH}
                cinemaFoY={cinemaFoY}
                concertFoW={concertFoW}
                concertFoH={concertFoH}
                concertFoY={concertFoY}
              />
            )}
            {isSouthernCaliforniaTile(t) && (() => {
              const lx   = coachellaMidX(t);
              const live =
                t === coachellaLive &&
                focus === 'coachella' &&
                lx != null &&
                isVenueInView(vx, t, lx, COACHELLA_STAGE_HALF);
              return <SouthernCaliforniaTile tileIndex={t} coachellaLive={live} />;
            })()}
            {kind === 'town' && <SmallTownTile tileIndex={t} />}
          </g>
          {/* Atmospheric haze — drawn OUTSIDE the scaled group, so it lives in
              unscaled tile-local coords where the tile spans 0..w. Width MUST be
              `w` (the real tile width), not `w/scale`: the latter always equals
              CITY_MID_W (2600), which makes narrow town tiles overflow ~1400px
              into their neighbour and overlap that tile's haze rect — a doubled-
              opacity vertical seam in the sky. */}
          <rect x={0} y={0} width={w} height={900} fill="url(#atmo)" />
        </>
      );
    // Tile content re-renders when venue focus/live state changes.
    // vx, cinemaHalf/concertHalf are excluded — they're either derived from the
    // above deps or are build-time constants.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cinemaLive, concertLive, coachellaLive, focus]);

    return (
      <ParallaxSvgLayer
        ref={ref}
        viewBoxX={vx}
        tileWidth={CITY_MID_W}
        tileOrigin={midOriginForTile}
        nearTileIndices={nearMidTiles}
        defs={
          <defs>
            <linearGradient id="atmo" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(180,205,235,0)" />
              <stop offset="100%" stopColor="rgba(180,205,235,.18)" />
            </linearGradient>
          </defs>
        }
      >
        {renderTile}
      </ParallaxSvgLayer>
    );
  },
));
