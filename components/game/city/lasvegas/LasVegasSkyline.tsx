import {
  Bellagio,
  DesertRidge,
  EiffelReplica,
  HighRoller,
  LuxorPyramid,
  StratTower,
  VenetianCampanile,
  VegasSphere,
  WelcomeSign,
} from './stripBuildings';

/** Las Vegas Strip skyline — render before EDC so the stage sits in front. */
export function LasVegasSkyline() {
  return (
    <>
      <DesertRidge />
      <StratTower x={150} />
      <LuxorPyramid x={470} />
      <EiffelReplica x={760} />
      <Bellagio x={1000} />
      <VenetianCampanile x={1190} />
      <VegasSphere cx={1470} r={185} />
      <HighRoller cx={1760} cy={400} r={130} />
      <WelcomeSign x={1880} />
    </>
  );
}
