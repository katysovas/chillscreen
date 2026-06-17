/**
 * Global mute flag for stage YouTube players — toggled from the in-game mute button.
 */

import { nudgeAllStagePlayers } from '@/lib/stagePlayerRegistry';

let muted = false;
const listeners = new Set<() => void>();

export function setAudioMuted(value: boolean) {
  if (value === muted) return;
  muted = value;
  listeners.forEach(fn => fn());
  if (!value) {
    // User gesture on mute toggle — must run synchronously (iOS blocks deferred unMute).
    nudgeAllStagePlayers();
  }
}

export function getAudioMuted() {
  return muted;
}

export function subscribeAudioMuted(fn: () => void) {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}
