/** Shared YouTube embed helpers for stage/cinema players. Client-only. */

import { SITE_URL } from '@/lib/site';

/** @see https://developers.google.com/youtube/iframe_api_reference#onStateChange */
export type YouTubePlayerState = -1 | 0 | 1 | 2 | 3 | 5;

const YT_ORIGINS = new Set([
  'https://www.youtube.com',
  'https://www.youtube-nocookie.com',
]);

type PendingCommand = { func: string; args: unknown[] };

const readyIframes = new WeakSet<HTMLIFrameElement>();
const pendingCommands = new WeakMap<HTMLIFrameElement, PendingCommand[]>();
let readyListenerOn = false;

function targetOrigin(iframe: HTMLIFrameElement): string {
  try {
    return new URL(iframe.src).origin;
  } catch {
    return 'https://www.youtube-nocookie.com';
  }
}

function findIframeBySource(source: MessageEventSource | null): HTMLIFrameElement | null {
  if (!source) return null;
  for (const el of document.querySelectorAll<HTMLIFrameElement>('iframe[data-stage-embed]')) {
    if (el.contentWindow === source) return el;
  }
  return null;
}

function flushPending(iframe: HTMLIFrameElement) {
  const queue = pendingCommands.get(iframe);
  if (!queue?.length) return;
  pendingCommands.delete(iframe);
  for (const cmd of queue) {
    postCommandImmediate(iframe, cmd.func, cmd.args);
  }
}

function markYouTubeReady(iframe: HTMLIFrameElement) {
  if (readyIframes.has(iframe)) return;
  readyIframes.add(iframe);
  flushPending(iframe);
}

function onYouTubeReadyMessage(e: MessageEvent) {
  if (!YT_ORIGINS.has(e.origin)) return;
  try {
    const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    if (data?.event !== 'onReady') return;
    const iframe = findIframeBySource(e.source);
    if (iframe) markYouTubeReady(iframe);
  } catch {
    // Non-JSON widget traffic — ignore.
  }
}

function ensureReadyListener() {
  if (readyListenerOn || typeof window === 'undefined') return;
  readyListenerOn = true;
  window.addEventListener('message', onYouTubeReadyMessage);
}

function sendListening(iframe: HTMLIFrameElement) {
  ensureReadyListener();
  iframe.contentWindow?.postMessage(
    JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
    targetOrigin(iframe),
  );
}

function postCommandImmediate(
  iframe: HTMLIFrameElement,
  func: string,
  args: unknown[] = [],
) {
  iframe.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args }),
    targetOrigin(iframe),
  );
}

/** Post a command — queued until the iframe fires `onReady`. */
export function postCommand(
  iframe: HTMLIFrameElement | null,
  func: string,
  args: unknown[] = [],
) {
  if (!iframe?.contentWindow) return;
  ensureReadyListener();
  if (!readyIframes.has(iframe)) {
    const queue = pendingCommands.get(iframe) ?? [];
    queue.push({ func, args });
    pendingCommands.set(iframe, queue);
    sendListening(iframe);
    return;
  }
  postCommandImmediate(iframe, func, args);
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

/**
 * Arm the widget API after iframe load — listening now, commands after `onReady`.
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

/** Drop ready/queued state when the iframe node is remounted. */
export function resetYouTubePlayerState(iframe: HTMLIFrameElement | null) {
  if (!iframe) return;
  readyIframes.delete(iframe);
  pendingCommands.delete(iframe);
}
