/** Live title from the Coachella main-stage LED wall. */

let nowPlayingTitle: string | null = null;
const listeners = new Set<() => void>();

export function setCoachellaNowPlaying(title: string | null) {
  const next = title?.trim() || null;
  if (next === nowPlayingTitle) return;
  nowPlayingTitle = next;
  listeners.forEach(fn => fn());
}

export function getCoachellaNowPlaying(): string | null {
  return nowPlayingTitle;
}

export function subscribeCoachellaNowPlaying(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
