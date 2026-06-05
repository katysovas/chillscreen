/**
 * Global "is the user's audio muted" flag, shared between the website's
 * background music (SFCity) and the concert stage's YouTube player (Concert)
 * so the mute button silences everything and the two sources never fight.
 */

let muted = false;
const listeners = new Set<() => void>();

export function setAudioMuted(value: boolean) {
  if (value === muted) return;
  muted = value;
  listeners.forEach(fn => fn());
}

export function getAudioMuted() {
  return muted;
}

export function subscribeAudioMuted(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
