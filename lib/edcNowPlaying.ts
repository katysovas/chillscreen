let title: string | null = null;
const listeners = new Set<() => void>();

export function setEdcNowPlaying(next: string | null) {
  title = next;
  listeners.forEach(fn => fn());
}

export function getEdcNowPlaying(): string | null {
  return title;
}

export function subscribeEdcNowPlaying(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
