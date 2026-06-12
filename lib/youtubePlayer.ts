/** Shared YouTube embed helpers for stage/cinema players. Client-only. */

import { SITE_URL } from '@/lib/site';

/** @see https://developers.google.com/youtube/iframe_api_reference#onStateChange */
export type YouTubePlayerState = -1 | 0 | 1 | 2 | 3 | 5;

function sendListening(iframe: HTMLIFrameElement) {
  iframe.contentWindow?.postMessage(
    JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
    '*',
  );
}

/**
 * Must match the embedding page origin or YouTube ignores IFrame API commands.
 * In the browser always use the live page origin (localhost in dev, production in prod).
 */
export function stageEmbedOrigin(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  try {
    return new URL(SITE_URL).origin;
  } catch {
    return 'https://whichstage.com';
  }
}

/** Canonical watch URL for attribution links (YouTube ToS / branding). */
export function youtubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`;
}

export function stageEmbedSrc(id: string, startSec = 0): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    rel: '0',
    iv_load_policy: '3',
    fs: '0',
    disablekb: '1',
    playsinline: '1',
    loop: '1',
    playlist: id,
    enablejsapi: '1',
    origin: stageEmbedOrigin(),
  });
  if (startSec > 2) params.set('start', String(Math.floor(startSec)));
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

/** Post a command immediately — YouTube accepts these without waiting for onReady. */
export function postCommand(
  iframe: HTMLIFrameElement | null,
  func: string,
  args: unknown[] = [],
) {
  iframe?.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args }),
    '*',
  );
}

/**
 * Register for IFrame API commands, then start muted autoplay.
 * Use only on first load — muting again after unmute breaks stage audio.
 */
export function primeYouTubePlayback(iframe: HTMLIFrameElement | null) {
  if (!iframe?.contentWindow) return;
  sendListening(iframe);
  postCommand(iframe, 'mute');
  postCommand(iframe, 'playVideo');
}

/** Resume playback without re-muting (gestures, sync, retries). */
export function nudgeYouTubePlayback(iframe: HTMLIFrameElement | null) {
  if (!iframe?.contentWindow) return;
  sendListening(iframe);
  postCommand(iframe, 'playVideo');
}

export function isYouTubePlaying(state: YouTubePlayerState): boolean {
  return state === 1;
}

export function applyYouTubeAudio(
  iframe: HTMLIFrameElement | null,
  siteMuted: boolean,
) {
  if (!iframe) return;
  if (siteMuted) {
    postCommand(iframe, 'mute');
  } else {
    postCommand(iframe, 'unMute');
    postCommand(iframe, 'setVolume', [55]);
  }
}

/** Hard stop — mute + pause so off-screen players cannot leak chopped audio. */
export function stopYouTubePlayback(iframe: HTMLIFrameElement | null) {
  if (!iframe) return;
  postCommand(iframe, 'mute');
  postCommand(iframe, 'pauseVideo');
}

/** Delayed play retries — does not re-mute (prime is caller's job once). */
export function scheduleYouTubePlaybackKicks(
  iframe: HTMLIFrameElement | null,
): () => void {
  const delays = [400, 1200, 2500, 5000, 8000];
  const timers = delays.map(ms =>
    window.setTimeout(() => nudgeYouTubePlayback(iframe), ms),
  );
  return () => {
    for (const t of timers) window.clearTimeout(t);
  };
}
