import { SFX_VOLUME } from './sfxVolume';

/** Drop your shutter clip at public/audio/paraloid-shutter.mp3 */
export const PARALOID_SHUTTER_SRC = '/audio/paraloid-shutter.mp3';

let shutter: HTMLAudioElement | null = null;

/** Camera shutter — plays on paraloid capture (independent of stage mute). */
export function playParaloidShutter() {
  if (typeof window === 'undefined') return;
  try {
    if (!shutter) {
      shutter = new Audio(PARALOID_SHUTTER_SRC);
      shutter.preload = 'auto';
      shutter.volume = SFX_VOLUME;
    }
    shutter.currentTime = 0;
    void shutter.play().catch(() => {});
  } catch {
    /* missing asset or autoplay blocked */
  }
}
