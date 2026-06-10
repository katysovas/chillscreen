import {
  groundWorldXAtVenue,
  groundWorldXAtVenueScreenPct,
  liveCoachellaMidWorldX,
  liveConcertMidWorldX,
  liveEdcMidWorldX,
  liveForestStageMidWorldX,
  liveSilentDiscoMidWorldX,
  liveWhichStageMidWorldX,
  venueScreenPct,
} from './concertDance';

/** Festival stages that host a Buz merch cart. */
export type StageAnchorKind = 'concert' | 'coachella' | 'edc' | 'which-stage' | 'forest' | 'silent-disco';

/** How far Buz wanders from the cart spot (ground world px). */
export const STAGE_VENDOR_WANDER_PX = 55;

/** Screen-% offset from stage center toward the crowd. */
const CROWD_OFFSET_PCT: Record<StageAnchorKind, number> = {
  concert: 11,
  coachella: 9,
  edc: 9,
  'which-stage': 9,
  forest: 9,
  'silent-disco': 9,
};

/** Half-width of the downstage spawn arc in screen-% (each side of crowd row). */
const STAGE_CROWD_HALF_SPREAD_PCT = 44;

function crowdSpreadT(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return (Math.abs(h) % 1000) / 1000;
}

/**
 * Ground-world spawn for a stage-crowd NPC — spread across the full downstage
 * floor in front of the live stage, not clustered on one anchor point.
 */
export function crowdSpawnWorldX(
  kind: StageAnchorKind,
  worldOff: number,
  seed: string,
  width?: number,
): number | null {
  const mid = liveAnchoredStageMidWorldX(kind, worldOff);
  if (mid == null) return null;

  const crowdRow = venueScreenPct(worldOff, mid) + CROWD_OFFSET_PCT[kind];
  const t = crowdSpreadT(seed);
  const screenPct = Math.max(
    6,
    Math.min(94, crowdRow + (t - 0.5) * STAGE_CROWD_HALF_SPREAD_PCT * 2),
  );
  return groundWorldXAtVenueScreenPct(worldOff, screenPct, width);
}

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
    case 'which-stage':
      return liveWhichStageMidWorldX(worldOff);
    case 'forest':
      return liveForestStageMidWorldX(worldOff);
    case 'silent-disco':
      return liveSilentDiscoMidWorldX(worldOff);
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
