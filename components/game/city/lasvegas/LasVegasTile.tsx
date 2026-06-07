import { LasVegasSkyline } from './LasVegasSkyline';
import { EDCStage } from './EDCStage';

type LasVegasTileProps = {
  edcLive?: boolean;
};

/** Las Vegas mid-layer — skyline behind, EDC stage in front (see MidLayer foreground pass). */
export function LasVegasTile({ edcLive = false }: LasVegasTileProps) {
  return (
    <>
      <LasVegasSkyline />
      <EDCStage live={edcLive} />
    </>
  );
}
