const PURCHASE_SRC = '/audio/purchase.mp3';
const PURCHASE_GAIN = 0.35;

let audioCtx: AudioContext | null = null;
let buffer: AudioBuffer | null = null;
let loadPromise: Promise<AudioBuffer | null> | null = null;
let fallback: HTMLAudioElement | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctx = window.AudioContext
    ?? (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) audioCtx = new Ctx();
  return audioCtx;
}

function getFallbackAudio(): HTMLAudioElement {
  if (!fallback) {
    fallback = new Audio(PURCHASE_SRC);
    fallback.preload = 'auto';
  }
  return fallback;
}

function loadPurchaseBuffer(ctx: AudioContext): Promise<AudioBuffer | null> {
  if (buffer) return Promise.resolve(buffer);
  if (!loadPromise) {
    loadPromise = fetch(PURCHASE_SRC)
      .then(res => {
        if (!res.ok) throw new Error(`purchase audio ${res.status}`);
        return res.arrayBuffer();
      })
      .then(ab => ctx.decodeAudioData(ab))
      .then(decoded => {
        buffer = decoded;
        return decoded;
      })
      .catch(() => null);
  }
  return loadPromise;
}

function playBoosted(ctx: AudioContext, buf: AudioBuffer) {
  const source = ctx.createBufferSource();
  const gain = ctx.createGain();
  gain.gain.value = PURCHASE_GAIN;
  source.buffer = buf;
  source.connect(gain);
  gain.connect(ctx.destination);
  source.start(0);
}

/** Sync HTMLAudio playback — must run in the same turn as a user click. */
function playFallback(): void {
  if (typeof window === 'undefined') return;
  try {
    const audio = getFallbackAudio();
    audio.volume = PURCHASE_GAIN;
    audio.pause();
    audio.currentTime = 0;
    void audio.play().catch(() => {});
  } catch {
    /* ignore */
  }
}

/** Warm/decode the clip and unlock playback on a user gesture (cart open). */
export function unlockPurchaseSound(): void {
  if (typeof window === 'undefined') return;

  try {
    const audio = getFallbackAudio();
    const prevVolume = audio.volume;
    audio.volume = 0.001;
    audio.pause();
    audio.currentTime = 0;
    void audio.play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        audio.volume = prevVolume;
      })
      .catch(() => {
        audio.volume = prevVolume;
      });
  } catch {
    /* ignore */
  }

  const ctx = getAudioContext();
  if (!ctx) return;
  void ctx.resume();
  void loadPurchaseBuffer(ctx);
}

/** Warm the purchase clip so boosted playback is ready. */
export function preloadPurchaseSound(): void {
  unlockPurchaseSound();
}

/** Play once after a successful vendor shop purchase (ignores stage mute). */
export function playPurchaseSound(): void {
  if (typeof window === 'undefined') return;

  const ctx = getAudioContext();
  if (ctx?.state === 'running' && buffer) {
    try {
      playBoosted(ctx, buffer);
      return;
    } catch {
      /* use HTML fallback below */
    }
  }

  playFallback();
}
