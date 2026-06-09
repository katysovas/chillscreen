import { COACHELLA_STAGE_MID_X } from '@/components/game/city/sandiego/constants';
import { WHICH_STAGE_MID_X } from '@/components/game/city/tentaroo/constants';
import { FOREST_STAGE_MID_X } from '@/components/game/city/forest/constants';
import { EDC_STAGE_MID_X } from '@/components/game/city/lasvegas/constants';
import { MID_F } from '@/lib/parallax';
import {
  CINEMA_SIGN_MID_X,
  cinemaMidX,
  concertLabel,
  concertMidX,
  VIEW_CENTER_X,
} from '@/lib/venues';
import { cityTileIndex } from '@/lib/spawn';
import { midOriginForTile } from '@/lib/worldTileGeometry';

/** Ground-x offset from spawn center (player at 50%) — sign sits to the right. */
export const WELCOME_SIGN_OFFSET_X = 300;

export type WelcomeStageEntry = {
  id: string;
  label: string;
  icon: string;
  accent: string;
  tileIndex: number;
  venueMidX: number;
};

/** All stages a new player can walk to, in west-to-east world order. */
export function welcomeStageEntries(): WelcomeStageEntry[] {
  const sf = cityTileIndex('sf');
  const vegas = cityTileIndex('vegas');
  const socal = cityTileIndex('san_diego');
  const tentaroo = cityTileIndex('tentaroo');
  const forest = cityTileIndex('forest');
  const seattle = cityTileIndex('seattle');

  return [
    {
      id: 'outside-hands',
      label: concertLabel(sf) ?? 'San Francisco',
      icon: '♪',
      accent: '#1a9a52',
      tileIndex: sf,
      venueMidX: concertMidX(sf) ?? 880,
    },
    {
      id: 'cinema',
      label: 'Cinema',
      icon: '🎬',
      accent: '#b8860b',
      tileIndex: sf,
      venueMidX: cinemaMidX(sf) ?? CINEMA_SIGN_MID_X,
    },
    {
      id: 'edc',
      label: 'Las Vegas',
      icon: '🦉',
      accent: '#00e5ff',
      tileIndex: vegas,
      venueMidX: EDC_STAGE_MID_X,
    },
    {
      id: 'coachella',
      label: 'The Desert',
      icon: '🎡',
      accent: '#e85074',
      tileIndex: socal,
      venueMidX: COACHELLA_STAGE_MID_X,
    },
    {
      id: 'which-stage',
      label: 'The Farm',
      icon: '🎪',
      accent: '#38f5b0',
      tileIndex: tentaroo,
      venueMidX: WHICH_STAGE_MID_X,
    },
    {
      id: 'forest',
      label: 'The Forest',
      icon: '🌲',
      accent: '#2dd4a0',
      tileIndex: forest,
      venueMidX: FOREST_STAGE_MID_X,
    },
    {
      id: 'seattle',
      label: concertLabel(seattle) ?? 'Seattle',
      icon: '♪',
      accent: '#1a9a52',
      tileIndex: seattle,
      venueMidX: concertMidX(seattle) ?? 880,
    },
  ];
}

/** Walk direction from a ground-layer x to a mid-layer venue (same math as venue signs). */
export function walkDirectionFromGroundX(
  signGroundX: number,
  tileIndex: number,
  venueMidX: number,
): 'left' | 'right' {
  const worldOffVenueCenters =
    (midOriginForTile(tileIndex) + venueMidX - VIEW_CENTER_X) / MID_F;
  const worldOffSignCenters = signGroundX - VIEW_CENTER_X;
  return worldOffVenueCenters >= worldOffSignCenters ? 'right' : 'left';
}

export function welcomeSignGroundX(spawnWorldOff: number): number {
  return spawnWorldOff + WELCOME_SIGN_OFFSET_X;
}

export type WelcomeSignSlot = {
  entry: WelcomeStageEntry;
  /** True walk direction — arrow always points this way regardless of wing. */
  dir: 'left' | 'right';
};

export type WelcomeSignRow = {
  left?: WelcomeSignSlot;
  right?: WelcomeSignSlot;
};

/** Stages grouped by walk direction from the welcome sign at spawn. */
export function welcomeStagesByDirection(signGroundX: number): {
  left: WelcomeStageEntry[];
  right: WelcomeStageEntry[];
} {
  const left: WelcomeStageEntry[] = [];
  const right: WelcomeStageEntry[] = [];

  for (const entry of welcomeStageEntries()) {
    const dir = walkDirectionFromGroundX(signGroundX, entry.tileIndex, entry.venueMidX);
    if (dir === 'left') left.push(entry);
    else right.push(entry);
  }

  return { left, right };
}

/**
 * Welcome junction rows — pair opposite directions when possible, then alternate
 * overflow across wings so the post stays visually balanced (arrows stay true).
 */
export function welcomeStageSignRows(signGroundX: number): WelcomeSignRow[] {
  const tagged: WelcomeSignSlot[] = welcomeStageEntries().map(entry => ({
    entry,
    dir: walkDirectionFromGroundX(signGroundX, entry.tileIndex, entry.venueMidX),
  }));

  const leftPool = tagged.filter(s => s.dir === 'left');
  const rightPool = tagged.filter(s => s.dir === 'right');

  const rows: WelcomeSignRow[] = [];

  while (leftPool.length > 0 && rightPool.length > 0) {
    rows.push({ left: leftPool.shift()!, right: rightPool.shift()! });
  }

  const overflow = [...leftPool, ...rightPool];
  let leftCount = rows.reduce((n, r) => n + (r.left ? 1 : 0), 0);
  let rightCount = rows.reduce((n, r) => n + (r.right ? 1 : 0), 0);

  for (const slot of overflow) {
    const partial = rows.find(r => !r.left || !r.right);
    if (partial) {
      if (!partial.left) {
        partial.left = slot;
        leftCount++;
      } else {
        partial.right = slot;
        rightCount++;
      }
      continue;
    }

    if (leftCount <= rightCount) {
      rows.push({ left: slot });
      leftCount++;
    } else {
      rows.push({ right: slot });
      rightCount++;
    }
  }

  return rows.length > 0 ? rows : [{}];
}
