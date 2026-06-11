/** Pins NPC world-x while in a server-driven pair conversation. */
const holds = new Map<string, number>();

export function setNpcConvoHold(npcId: string, worldX: number): void {
  holds.set(npcId, worldX);
}

export function getNpcConvoHold(npcId: string): number | undefined {
  return holds.get(npcId);
}

export function clearNpcConvoHolds(): void {
  holds.clear();
}
