/** Shared NPC position sync helpers — party server + browser client. */

export type NpcPositionSync = { id: string; worldX: number; pct: number };

const WORLD_DELTA = 1.25;
export const NPC_SYNC_MAX_PER_PACKET = 48;

/** Positions that moved enough since the last relay to warrant a packet. */
export function diffNpcPositions(
  incoming: NpcPositionSync[],
  previous: NpcPositionSync[],
): NpcPositionSync[] {
  if (previous.length === 0) return incoming.slice(0, NPC_SYNC_MAX_PER_PACKET);

  const prevMap = new Map(previous.map(p => [p.id, p]));
  const changed: NpcPositionSync[] = [];

  for (const p of incoming) {
    const old = prevMap.get(p.id);
    if (!old || Math.abs(old.worldX - p.worldX) >= WORLD_DELTA) {
      changed.push(p);
    }
  }

  if (changed.length === 0) return [];
  if (changed.length > incoming.length * 0.55) {
    return incoming.slice(0, NPC_SYNC_MAX_PER_PACKET);
  }
  return changed.slice(0, NPC_SYNC_MAX_PER_PACKET);
}

/** Merge a delta snapshot into the follower map (do not clear missing ids). */
export function mergeNpcSyncMap(
  sync: Map<string, number>,
  positions: Pick<NpcPositionSync, 'id' | 'worldX'>[],
): void {
  for (const p of positions) {
    if (p.id && Number.isFinite(p.worldX)) sync.set(p.id, p.worldX);
  }
}
