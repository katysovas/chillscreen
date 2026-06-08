/** Per-frame NPC position update — returns world-x for collision (NaN when off-screen). */
export type NpcMovementTick = (
  worldOff: number,
  viewportWidth: number,
) => number;

const ticks = new Map<number, NpcMovementTick>();

export function setNpcMovementTick(index: number, tick: NpcMovementTick | null) {
  if (tick === null) ticks.delete(index);
  else ticks.set(index, tick);
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
