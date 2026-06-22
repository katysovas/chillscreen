export type EaselMilestoneEvent = {
  npcId: string;
  topic: string;
  pct: number;
  line: string;
};

type Listener = (event: EaselMilestoneEvent) => void;

const listeners = new Set<Listener>();

export function emitEaselMilestone(event: EaselMilestoneEvent): void {
  listeners.forEach(fn => fn(event));
}

export function subscribeEaselMilestones(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
