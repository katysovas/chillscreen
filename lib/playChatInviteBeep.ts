import { getAudioMuted } from './audioMute';
import { SFX_VOLUME } from './sfxVolume';

let beep: HTMLAudioElement | null = null;

/** Play once when another real player opens 1:1 chat with you. */
export function playChatInviteBeep() {
  if (typeof window === 'undefined' || getAudioMuted()) return;
  try {
    if (!beep) {
      beep = new Audio('/audio/beep.mp3');
      beep.preload = 'auto';
      beep.volume = SFX_VOLUME;
    }
    beep.currentTime = 0;
    void beep.play().catch(() => {});
  } catch {
    /* ignore — autoplay or missing asset */
  }
}
