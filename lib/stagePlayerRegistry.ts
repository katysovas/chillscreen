/** Per-frame sync for live YouTube stage players (mute/pause when off-screen). */
const syncs = new Set<() => void>();

export function registerStagePlayerSync(sync: () => void): () => void {
  syncs.add(sync);
  return () => { syncs.delete(sync); };
}

/** Called once per game frame from SFCity's main RAF loop. */
export function runAllStagePlayerSyncs() {
  for (const sync of syncs) sync();
}
