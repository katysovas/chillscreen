import { CINEMA_SCALE, CINEMA_HEIGHT, CINEMA_WIDTH } from '../Cinema';
import { CONCERT_SCALE, CONCERT_HEIGHT, CONCERT_WIDTH } from '../Concert';
import {
  cinemaLiveTile,
  concertLiveTile,
  venueInFocus,
} from '@/lib/venues';
import { worldTileKind } from '@/lib/worldTiles';
import { MID_F, MID_TILE } from '@/lib/parallax';
import { ParallaxSvgLayer } from './shared/ParallaxSvgLayer';
import { GradientMidTerrain } from './shared/GradientMidTerrain';
import { CityBuildingsTile } from './buildings/CityBuildingsTile';
import { CityVenuesTile } from './CityVenuesLayer';
import { MidBushes } from './MidBushes';
import { SfMidFeatures } from './SfMidFeatures';
import { SeattleBuildingsTile, SeattleMidFeatures } from './seattle';
import { SmallTownTile } from './town';
import { TransitionWater } from './transition';

type MidLayerProps = {
  worldOff: number;
};

/** Mid parallax: SF → countryside → Seattle → countryside → SF. */
export function MidLayer({ worldOff }: MidLayerProps) {
  const vx = worldOff * MID_F;
  const cinemaLive = cinemaLiveTile(vx);
  const concertLive = concertLiveTile(vx);
  const focus = venueInFocus(vx);
  const cinemaFoW = CINEMA_WIDTH * CINEMA_SCALE;
  const cinemaFoH = CINEMA_HEIGHT * CINEMA_SCALE;
  const cinemaFoY = 670 - cinemaFoH;
  const cinemaHalf = Math.ceil(cinemaFoW / 2) + 24;
  const concertFoW = CONCERT_WIDTH * CONCERT_SCALE;
  const concertFoH = CONCERT_HEIGHT * CONCERT_SCALE;
  const concertFoY = 670 - concertFoH;
  const concertHalf = Math.ceil(concertFoW / 2) + 24;

  const venueProps = {
    vx,
    cinemaLive,
    concertLive,
    focus,
    cinemaHalf,
    concertHalf,
    cinemaFoW,
    cinemaFoH,
    cinemaFoY,
    concertFoW,
    concertFoH,
    concertFoY,
  };

  return (
    <ParallaxSvgLayer
      viewBoxX={vx}
      tileWidth={MID_TILE}
      defs={
        <defs>
          <linearGradient id="atmo" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(180,205,235,0)" />
            <stop offset="100%" stopColor="rgba(180,205,235,.18)" />
          </linearGradient>
        </defs>
      }
    >
      {t => {
        const kind = worldTileKind(t);
        return (
          <>
            <GradientMidTerrain tileIndex={t} />
            <TransitionWater tileIndex={t} />
            {kind === 'seattle' && <SeattleMidFeatures tileIndex={t} />}
            {kind === 'sf' && (
              <>
                <CityBuildingsTile />
                <CityVenuesTile tileIndex={t} {...venueProps} />
                <MidBushes />
                <SfMidFeatures />
              </>
            )}
            {kind === 'seattle' && <SeattleBuildingsTile />}
            {kind === 'town' && <SmallTownTile tileIndex={t} />}
            <rect x={0} y={0} width={MID_TILE} height={900} fill="url(#atmo)" />
          </>
        );
      }}
    </ParallaxSvgLayer>
  );
}
