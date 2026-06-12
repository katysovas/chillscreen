/** % of viewport width — player must be this close to greet an NPC. */
export const NPC_TOUCH_DIST_VW = 0.05;

/** Looser threshold for NPC↔NPC pair convos (wandering cast rarely overlaps greet range). */
export const NPC_PAIR_DIST_VW = 0.28;

/** Match NPC.tsx — DOM stays visible in this screen-% band. */
export const NPC_SCREEN_MIN_PCT = -22;
export const NPC_SCREEN_MAX_PCT = 122;

export type PlayerViewSnapshot = {
  worldOff: number;
  viewportWidth: number;
};

/** Convert world-x to screen % with the player centered at 50%. */
export function worldXToScreenPct(
  worldX: number,
  worldOff: number,
  viewportWidth: number,
): number {
  return 50 + ((worldX - worldOff) / viewportWidth) * 100;
}

export function npcInPlayerView(
  npcWorldX: number,
  worldOff: number,
  viewportWidth: number,
): boolean {
  if (!Number.isFinite(npcWorldX) || !Number.isFinite(worldOff) || viewportWidth <= 0) {
    return false;
  }
  const pct = worldXToScreenPct(npcWorldX, worldOff, viewportWidth);
  return pct >= NPC_SCREEN_MIN_PCT && pct <= NPC_SCREEN_MAX_PCT;
}

export function npcPairInAnyPlayerView(
  worldXA: number,
  worldXB: number,
  views: PlayerViewSnapshot[],
): boolean {
  if (views.length === 0) return false;
  return views.some(
    view =>
      npcInPlayerView(worldXA, view.worldOff, view.viewportWidth)
      && npcInPlayerView(worldXB, view.worldOff, view.viewportWidth),
  );
}

/**
 * Pair convo eligibility for ambient crowds — midpoint in view and speakers
 * close enough to plausibly chat (works better than both-in-view with large casts).
 */
export function npcPairEligibleForConvo(
  worldXA: number,
  worldXB: number,
  views: PlayerViewSnapshot[],
): boolean {
  if (views.length === 0) return false;
  if (!Number.isFinite(worldXA) || !Number.isFinite(worldXB)) return false;
  const mid = (worldXA + worldXB) / 2;
  return views.some(view => {
    const vw = view.viewportWidth;
    if (vw <= 0) return false;
    if (!npcInPlayerView(mid, view.worldOff, vw)) return false;
    return npcsAreCloseEnoughForPair(worldXA, worldXB, vw);
  });
}

export function npcTouchDistPx(viewportWidth: number): number {
  return NPC_TOUCH_DIST_VW * viewportWidth;
}

export function npcPairDistPx(viewportWidth: number): number {
  return NPC_PAIR_DIST_VW * viewportWidth;
}

export function npcsAreCloseEnough(
  worldXA: number,
  worldXB: number,
  viewportWidth: number,
): boolean {
  if (!Number.isFinite(worldXA) || !Number.isFinite(worldXB)) return false;
  return Math.abs(worldXA - worldXB) < npcTouchDistPx(viewportWidth);
}

export function npcsAreCloseEnoughForPair(
  worldXA: number,
  worldXB: number,
  viewportWidth: number,
): boolean {
  if (!Number.isFinite(worldXA) || !Number.isFinite(worldXB)) return false;
  return Math.abs(worldXA - worldXB) < npcPairDistPx(viewportWidth);
}

export type NpcPosition = { id: string; worldX: number };
