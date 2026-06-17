import {
  Bellagio,
  DesertRidge,
  EiffelReplica,
  HighRoller,
  LuxorPyramid,
  StratTower,
  VenetianCampanile,
  VegasSphere,
} from './stripBuildings';
import { LasVegasSign } from './LasVegasSign';
import { DECORATIVE_SHAPE } from '../shared/parallaxLayerStyle';
import { VEGAS_STATIC_SIGN_X, VEGAS_STATIC_SPHERE_CX, VEGAS_STATIC_SPHERE_R } from './constants';

type LasVegasSkylineProps = {
  /** Fixed-camera /lasvegas — Sphere west of stage, Strip fills the viewport. */
  staticViewport?: boolean;
};

/** Las Vegas Strip skyline — render before EDC so the stage sits in front. */
export function LasVegasSkyline({ staticViewport = false }: LasVegasSkylineProps) {
  if (staticViewport) {
    return (
      <g {...DECORATIVE_SHAPE}>
        <DesertRidge />
        <StratTower x={110} />
        <LuxorPyramid x={540} />
        <VegasSphere cx={VEGAS_STATIC_SPHERE_CX} r={VEGAS_STATIC_SPHERE_R} />
        <EiffelReplica x={860} />
        <Bellagio x={1080} />
        <VenetianCampanile x={1260} />
        <LasVegasSign x={VEGAS_STATIC_SIGN_X} />
        <HighRoller cx={1320} cy={400} r={120} />
      </g>
    );
  }

  return (
    <g {...DECORATIVE_SHAPE}>
      <DesertRidge />
      <StratTower x={150} />
      <LuxorPyramid x={470} />
      <EiffelReplica x={760} />
      <Bellagio x={1000} />
      <VenetianCampanile x={1190} />
      <LasVegasSign x={1150} />
      <VegasSphere cx={1470} r={185} />
      <HighRoller cx={1760} cy={400} r={130} />
    </g>
  );
}
