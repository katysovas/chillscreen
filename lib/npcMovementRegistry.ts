/** Per-frame NPC position update — returns world-x for collision (NaN when off-screen). */
export type NpcMovementTick = (
  worldOff: number,
  viewportWidth: number,
) => number;

const ticks = new Map<number, NpcMovementTick>();
const syncedWorldX = new Map<number, number>();
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

export function setNpcSyncedWorldX(index: number, worldX: number | null) {
  if (worldX == null || !Number.isFinite(worldX)) syncedWorldX.delete(index);
  else syncedWorldX.set(index, worldX);
}

export function getNpcSyncedWorldX(index: number): number | undefined {
  return syncedWorldX.get(index);
}

export function clearNpcSyncedWorldXs() {
  syncedWorldX.clear();
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
