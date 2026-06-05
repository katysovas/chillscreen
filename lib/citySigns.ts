import { worldTileSlot } from '@/lib/worldTiles';

export type SingleCitySignDef = {
  type: 'single';
  label: string;
  dir: 'left' | 'right';
  icon: string;
  accent: string;
  xFrac: number;
};

export type CombinedTownSignDef = {
  type: 'combined';
  xFrac: number;
  leftCity: { label: string; icon: string; accent: string };
  rightCity: { label: string; icon: string; accent: string };
};

export type RoadSignDef = SingleCitySignDef | CombinedTownSignDef;

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

const TOWN_CENTER = 0.5;

/**
 * SF → town → San Diego+Coachella → town → Seattle → town
 * Never label the city you're already on.
 */
export function citySignsForTile(tileIndex: number): RoadSignDef[] {
  const slot = worldTileSlot(tileIndex);

  switch (slot) {
    case 0:
      return [{ type: 'single', ...SAN_DIEGO, dir: 'right', xFrac: 0.72 }];
    case 1:
      return [{ type: 'combined', xFrac: TOWN_CENTER, leftCity: SF, rightCity: SAN_DIEGO }];
    case 2:
      return [{ type: 'single', ...SEATTLE, dir: 'right', xFrac: 0.72 }];
    case 3:
      return [{ type: 'combined', xFrac: TOWN_CENTER, leftCity: COACHELLA, rightCity: SEATTLE }];
    case 4:
      return [{ type: 'single', ...SF, dir: 'right', xFrac: 0.72 }];
    case 5:
      return [{ type: 'combined', xFrac: TOWN_CENTER, leftCity: SEATTLE, rightCity: SF }];
    default:
      return [];
  }
}
