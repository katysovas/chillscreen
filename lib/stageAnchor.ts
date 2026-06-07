import {
  groundWorldXAtVenue,
  liveCoachellaMidWorldX,
  liveConcertMidWorldX,
  liveEdcMidWorldX,
} from './concertDance';

/** Festival stages that host a Buz merch cart. */
export type StageAnchorKind = 'concert' | 'coachella' | 'edc';

/** How far Buz wanders from the cart spot (ground world px). */
export const STAGE_VENDOR_WANDER_PX = 55;

/** Screen-% offset from stage center toward the crowd. */
const CROWD_OFFSET_PCT: Record<StageAnchorKind, number> = {
  concert: 11,
  coachella: 9,
  edc: 9,
};

export function liveAnchoredStageMidWorldX(
  kind: StageAnchorKind,
  worldOff: number,
): number | null {
  switch (kind) {
    case 'concert':
      return liveConcertMidWorldX(worldOff);
    case 'coachella':
      return liveCoachellaMidWorldX(worldOff);
    case 'edc':
      return liveEdcMidWorldX(worldOff);
  }
}

/** Ground-world cart position in front of the live stage, or null when off-screen. */
export function vendorAnchorGroundWorldX(
  kind: StageAnchorKind,
  worldOff: number,
  width?: number,
): number | null {
  const mid = liveAnchoredStageMidWorldX(kind, worldOff);
  if (mid == null) return null;
  return groundWorldXAtVenue(worldOff, mid, CROWD_OFFSET_PCT[kind], width);
}
