/** Per-frame NPC position update — returns world-x for collision (NaN when off-screen). */
export type NpcMovementTick = (
  worldOff: number,
  viewportWidth: number,
) => number;

const ticks = new Map<number, NpcMovementTick>();
/** Leader screen-% per cast index — followers convert with local off + width. */
const syncedScreenPct = new Map<number, number>();
let networkFollowMode = false;

export function setNpcMovementTick(index: number, tick: NpcMovementTick | null) {
  if (tick === null) ticks.delete(index);
  else ticks.set(index, tick);
}

export function setNpcNetworkFollowMode(enabled: boolean) {
  networkFollowMode = enabled;
}

export function isNpcNetworkFollowMode(): boolean {
  return networkFollowMode;
}

export function setNpcSyncedScreenPct(index: number, pct: number | null) {
  if (pct == null || !Number.isFinite(pct)) syncedScreenPct.delete(index);
  else syncedScreenPct.set(index, pct);
}

export function getNpcSyncedScreenPct(index: number): number | undefined {
  return syncedScreenPct.get(index);
}

export function clearNpcSyncedScreenPcts() {
  syncedScreenPct.clear();
}

/** Run every registered NPC movement step (called once per game frame). */
export function runAllNpcMovementTicks(
  worldOff: number,
  viewportWidth: number,
  out: number[],
) {
  for (const [i, tick] of ticks) {
    out[i] = tick(worldOff, viewportWidth);
  }
}
