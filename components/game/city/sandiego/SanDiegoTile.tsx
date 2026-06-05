import { worldTileKind } from '@/lib/worldTiles';
import { DesertMountains } from './DesertMountains';
import { SanDiegoBay } from './SanDiegoBay';
import { CoronadoBridge } from './CoronadoBridge';
import { SanDiegoSkyline } from './SanDiegoSkyline';
import { SanDiegoApproach } from './SanDiegoApproach';

type SanDiegoTileProps = {
  tileIndex: number;
};

/** San Diego mid-layer tile — bay, Coronado Bridge, downtown skyline. */
export function SanDiegoTile({ tileIndex }: SanDiegoTileProps) {
  const fromTown = worldTileKind(tileIndex - 1) === 'town';
  const toTown   = worldTileKind(tileIndex + 1) === 'town';

  return (
    <>
      {fromTown && <SanDiegoApproach tileIndex={tileIndex} />}
      <DesertMountains tileIndex={tileIndex} fadeLeft={fromTown} fadeRight={toTown} />
      <SanDiegoBay tileIndex={tileIndex} fadeLeft={fromTown} />
      <CoronadoBridge />
      <SanDiegoSkyline />
    </>
  );
}
