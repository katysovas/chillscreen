/** Live title from the Deep Space screen — updated by the active stage instance. */

let nowPlayingTitle: string | null = null;
const listeners = new Set<() => void>();

export function setDeepSpaceNowPlaying(title: string | null) {
  const next = title?.trim() || null;
  if (next === nowPlayingTitle) return;
  nowPlayingTitle = next;
  listeners.forEach(fn => fn());
}

export function getDeepSpaceNowPlaying(): string | null {
  return nowPlayingTitle;
}

export function subscribeDeepSpaceNowPlaying(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
