import { worldTileSlot } from '@/lib/worldTiles';

export type CombinedTownSignDef = {
  xFrac: number;
  leftCity: { label: string; icon: string; accent: string };
  rightCity: { label: string; icon: string; accent: string };
};

const SF = {
  label: 'San Francisco',
  icon: '🌉',
  accent: '#c24f2c',
} as const;

const SEATTLE = {
  label: 'Seattle',
  icon: '🌲',
  accent: '#3d6b8a',
} as const;

const SAN_DIEGO = {
  label: 'San Diego',
  icon: '🌴',
  accent: '#4a90b8',
} as const;

const COACHELLA = {
  label: 'Coachella',
  icon: '🎡',
  accent: '#e85074',
} as const;

/** Tentaroo festival grounds — city name on road signs. */
export const TENNESSEE = {
  label: 'Tennessee',
  icon: '🎸',
  accent: '#50b87a',
} as const;

const VEGAS = {
  label: 'Las Vegas',
  icon: '🎰',
  accent: '#ff2e9a',
} as const;

const TOWN_CENTER = 0.5;

/**
 * SF → town → Vegas → town → SoCal → town → Tentaroo → town → Seattle → town
 * Junction poles only — one combined left/right sign per connector town.
 */
export function citySignsForTile(tileIndex: number): CombinedTownSignDef[] {
  const slot = worldTileSlot(tileIndex);

  switch (slot) {
    case 1:
      return [{ xFrac: TOWN_CENTER, leftCity: SF, rightCity: VEGAS }];
    case 3:
      return [{ xFrac: TOWN_CENTER, leftCity: VEGAS, rightCity: SAN_DIEGO }];
    case 5:
      return [{ xFrac: TOWN_CENTER, leftCity: COACHELLA, rightCity: TENNESSEE }];
    case 7:
      return [{ xFrac: TOWN_CENTER, leftCity: TENNESSEE, rightCity: SEATTLE }];
    case 9:
      return [{ xFrac: TOWN_CENTER, leftCity: SEATTLE, rightCity: SF }];
    default:
      return [];
  }
}
