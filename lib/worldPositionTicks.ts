/** Imperative screen positioning — runs inside SFCity's game-frame loop (same as NPCs). */
export type WorldPositionTick = (worldOff: number, viewportWidth: number) => void;

const ticks = new Set<WorldPositionTick>();

export function setWorldPositionTick(tick: WorldPositionTick): () => void {
  ticks.add(tick);
  return () => { ticks.delete(tick); };
}

export function runAllWorldPositionTicks(worldOff: number, viewportWidth: number) {
  for (const tick of ticks) tick(worldOff, viewportWidth);
}
