import { getAudioMuted } from './audioMute';
import { SFX_VOLUME } from './sfxVolume';

const FOUND_SRC = '/audio/found.mp3';

let found: HTMLAudioElement | null = null;

/** Coin pickup / ground score chime. */
export function playFoundSound() {
  if (typeof window === 'undefined' || getAudioMuted()) return;
  try {
    if (!found) {
      found = new Audio(FOUND_SRC);
      found.preload = 'auto';
      found.volume = SFX_VOLUME;
    }
    found.currentTime = 0;
    void found.play().catch(() => {});
  } catch {
    /* ignore — autoplay or missing asset */
  }
}
