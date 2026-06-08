import { DesertMountains } from './DesertMountains';
import { SanDiegoBay } from './SanDiegoBay';
import { CoronadoBridge } from './CoronadoBridge';
import { SanDiegoSkyline } from './SanDiegoSkyline';
import { SanDiegoApproach } from './SanDiegoApproach';
import { FestivalWheel } from './FestivalWheel';
import { Tent } from './Tent';
import { BalloonChain } from './BalloonChain';
import { StringLights } from './StringLights';
import { Palm } from './Palm';
import { worldTileKind } from '@/lib/worldTiles';

type SouthernCaliforniaTileProps = {
  tileIndex: number;
};

/**
 * San Diego (west) + Coachella festival (east) on one tile.
 * Main stage renders in the mid foreground layer (above town cottages).
 */
export function SouthernCaliforniaTile({ tileIndex }: SouthernCaliforniaTileProps) {
  const fromTown = worldTileKind(tileIndex - 1) === 'town';
  const toTown   = worldTileKind(tileIndex + 1) === 'town';

  return (
    <>
      {fromTown && <SanDiegoApproach tileIndex={tileIndex} />}
      <DesertMountains tileIndex={tileIndex} fadeLeft={fromTown} fadeRight={toTown} />
      <SanDiegoBay tileIndex={tileIndex} fadeLeft={fromTown} />
      <CoronadoBridge />
      <SanDiegoSkyline />
      <Tent x={1580} w={150} h={150} col="#ede7dd" />
      <FestivalWheel />
      <BalloonChain />
      <StringLights />
      <Tent x={1880} w={92} h={86} col="#e9d8c0" />
      <Tent x={2520} w={110} h={104} col="#e6e0d4" />
      <Palm x={1640} h={120} lean={7} />
      <Palm x={1980} h={104} lean={-6} />
      <Palm x={2490} h={128} lean={6} />
    </>
  );
}
