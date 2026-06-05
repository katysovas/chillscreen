import { DesertMountains } from './DesertMountains';
import { FestivalWheel } from './FestivalWheel';
import { Tent } from './Tent';
import { BalloonChain } from './BalloonChain';
import { StringLights } from './StringLights';
import { FestivalStage } from './FestivalStage';
import { Palm } from './Palm';

type CoachellaTileProps = {
  live?: boolean;
};

/** Coachella festival grounds — main stage plays YouTube when in focus. */
export function CoachellaTile({ live = false }: CoachellaTileProps) {
  return (
    <>
      <DesertMountains />
      <Tent x={1580} w={150} h={150} col="#ede7dd" />
      <FestivalWheel />
      <BalloonChain />
      <StringLights />
      <Tent x={1880} w={92} h={86} col="#e9d8c0" />
      <Tent x={2520} w={110} h={104} col="#e6e0d4" />
      <Palm x={1640} h={120} lean={7} />
      <Palm x={1980} h={104} lean={-6} />
      <FestivalStage live={live} />
      <Palm x={2490} h={128} lean={6} />
    </>
  );
}
