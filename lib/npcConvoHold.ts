/** Pins NPC world-x while in a server-driven pair conversation. */

const holds = new Map<string, number>();
let releaseTimer: ReturnType<typeof setTimeout> | null = null;
let releaseListener: (() => void) | null = null;

export function setNpcConvoHold(npcId: string, worldX: number): void {
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  holds.set(npcId, worldX);
}

export function clearNpcConvoHold(npcId: string): void {
  if (!holds.delete(npcId)) return;
  releaseListener?.();
}

export function getNpcConvoHold(npcId: string): number | undefined {
  return holds.get(npcId);
}

export function hasNpcConvoHold(npcId: string): boolean {
  return holds.has(npcId);
}

/** Notify React when a delayed release completes (walking / glow can update). */
export function setNpcConvoReleaseListener(listener: (() => void) | null): void {
  releaseListener = listener;
}

export function clearNpcConvoHolds(): void {
  if (releaseTimer) {
    clearTimeout(releaseTimer);
    releaseTimer = null;
  }
  if (holds.size > 0) holds.clear();
  releaseListener?.();
}

/** Keep NPCs pinned briefly after the convo ends, then resume wandering. */
export function scheduleNpcConvoRelease(delayMs: number): void {
  if (releaseTimer) clearTimeout(releaseTimer);
  releaseTimer = setTimeout(() => {
    releaseTimer = null;
    holds.clear();
    releaseListener?.();
  }, delayMs);
}
