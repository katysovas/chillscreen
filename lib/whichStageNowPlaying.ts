/** Live title from the Which Stage LED wall on Tentaroo tiles. */

let nowPlayingTitle: string | null = null;
const listeners = new Set<() => void>();

export function setWhichStageNowPlaying(title: string | null) {
  const next = title?.trim() || null;
  if (next === nowPlayingTitle) return;
  nowPlayingTitle = next;
  listeners.forEach(fn => fn());
}

export function getWhichStageNowPlaying(): string | null {
  return nowPlayingTitle;
}

export function subscribeWhichStageNowPlaying(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}
