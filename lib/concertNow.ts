/** True when the live concert stage is in the player's mid-layer view. */

let inView = false;
const listeners = new Set<() => void>();

export function setConcertInView(value: boolean) {
  if (value === inView) return;
  inView = value;
  listeners.forEach(fn => fn());
}

export function getConcertInView() {
  return inView;
}

export function subscribeConcertInView(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
