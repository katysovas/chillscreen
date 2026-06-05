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
  /** City on the top row — arrow points left. */
  leftCity: { label: string; icon: string; accent: string };
  /** City on the bottom row — arrow points right. */
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

const TOWN_CENTER = 0.5;

/**
 * Direction signs per world tile — never label the city you're already in.
 * SF (0) → town (1,2) → Seattle (3) → town (4,5) → SF …
 */
export function citySignsForTile(tileIndex: number): RoadSignDef[] {
  const slot = worldTileSlot(tileIndex);

  switch (slot) {
    case 0:
      return [{ type: 'single', ...SEATTLE, dir: 'right', xFrac: 0.72 }];
    case 3:
      return [{ type: 'single', ...SF, dir: 'left', xFrac: 0.28 }];
    case 1:
    case 2:
      return [
        {
          type: 'combined',
          xFrac: TOWN_CENTER,
          leftCity: SF,
          rightCity: SEATTLE,
        },
      ];
    case 4:
    case 5:
      return [
        {
          type: 'combined',
          xFrac: TOWN_CENTER,
          leftCity: SEATTLE,
          rightCity: SF,
        },
      ];
    default:
      return [];
  }
}
