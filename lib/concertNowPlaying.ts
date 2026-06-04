/** Live title from the concert stage LED wall — updated by the active Concert instance. */

let nowPlayingTitle: string | null = null;
const listeners = new Set<() => void>();

export function setConcertNowPlaying(title: string | null) {
  const next = title?.trim() || null;
  if (next === nowPlayingTitle) return;
  nowPlayingTitle = next;
  listeners.forEach(fn => fn());
}

export function getConcertNowPlaying(): string | null {
  return nowPlayingTitle;
}

export function subscribeConcertNowPlaying(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
