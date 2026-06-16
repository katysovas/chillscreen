/** Imperative NPC dance toggles — avoids React state on proximity checks (~15 Hz). */

const toggles = new Map<number, (dancing: boolean) => void>();

export function setNpcDancingToggle(index: number, toggle: ((dancing: boolean) => void) | null): void {
  if (toggle === null) toggles.delete(index);
  else toggles.set(index, toggle);
}

export function applyNpcDancing(index: number, dancing: boolean): void {
  toggles.get(index)?.(dancing);
}

export function clearNpcDancingToggles(): void {
  toggles.clear();
}
