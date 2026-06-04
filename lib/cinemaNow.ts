/** Live title from the Chill Cinema screen — updated by the active Cinema instance. */

let nowPlayingTitle: string | null = null;
const listeners = new Set<() => void>();

export function setCinemaNowPlaying(title: string | null) {
  const next = title?.trim() || null;
  if (next === nowPlayingTitle) return;
  nowPlayingTitle = next;
  listeners.forEach(fn => fn());
}

export function getCinemaNowPlaying(): string | null {
  return nowPlayingTitle;
}

export function subscribeCinemaNowPlaying(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
