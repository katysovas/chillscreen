/** Client-side: NPC has reached the easel stand target (glow bubble on). */

type Listener = () => void;

const readyByNpc = new Map<string, boolean>();
const listeners = new Set<Listener>();

export function setEaselPainterReady(npcId: string, isReady: boolean): void {
  if (readyByNpc.get(npcId) === isReady) return;
  readyByNpc.set(npcId, isReady);
  listeners.forEach(fn => fn());
}

export function isEaselPainterReady(npcId: string): boolean {
  return readyByNpc.get(npcId) ?? false;
}

export function subscribeEaselPainterReady(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
