import { Fir } from '../trees/Fir';
import { SEATTLE_GND } from '../constants';
import { SeattleGlassTowers } from './SeattleGlassTowers';
import { SmithTower } from './SmithTower';
import { ColumbiaCenter } from './ColumbiaCenter';

type SeattleBuildingsTileProps = {
  /** Static viewport — skip east-side foothill props (Rainier is the backdrop). */
  staticViewport?: boolean;
};

/** Downtown skyline + foreground evergreens for one Seattle tile. */
export function SeattleBuildingsTile({ staticViewport = false }: SeattleBuildingsTileProps) {
  const GND = SEATTLE_GND;

  return (
    <>
      {!staticViewport && (
        <path d="M980,668 Q1360,632 1760,664 L1760,900 L980,900 Z" fill="#5c6b5e" opacity={0.5} />
      )}
      <SeattleGlassTowers />
      <SmithTower />
      <ColumbiaCenter />
      <Fir x={905} y={GND} h={110} w={70} />
      <Fir x={975} y={GND} h={88} w={58} />
      {!staticViewport && (
        <>
          <Fir x={1855} y={GND} h={120} w={76} />
          <Fir x={1955} y={GND} h={96} w={62} />
          <Fir x={2090} y={GND} h={112} w={72} />
        </>
      )}
    </>
  );
}
