/** Shared YouTube embed helpers for stage/cinema players. Client-only. */

export function stageEmbedSrc(id: string, startSec = 0): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    cc_load_policy: '3',
    fs: '0',
    disablekb: '1',
    playsinline: '1',
    loop: '1',
    playlist: id,
    enablejsapi: '1',
    origin: window.location.origin,
  });
  if (startSec > 2) params.set('start', String(Math.floor(startSec)));
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

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
  iframe.contentWindow.postMessage(
    JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
    '*',
  );
  postCommand(iframe, 'mute');
  postCommand(iframe, 'playVideo');
}

/** Resume playback without re-muting (gestures, sync, retries). */
export function nudgeYouTubePlayback(iframe: HTMLIFrameElement | null) {
  if (!iframe?.contentWindow) return;
  iframe.contentWindow.postMessage(
    JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
    '*',
  );
  postCommand(iframe, 'playVideo');
}

/** @deprecated Prefer primeYouTubePlayback / nudgeYouTubePlayback */
export function kickYouTubePlayback(iframe: HTMLIFrameElement | null) {
  primeYouTubePlayback(iframe);
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

export function scheduleYouTubePlaybackKicks(
  iframe: HTMLIFrameElement | null,
): () => void {
  primeYouTubePlayback(iframe);
  const delays = [400, 1200, 2500, 5000, 8000];
  const timers = delays.map(ms =>
    window.setTimeout(() => nudgeYouTubePlayback(iframe), ms),
  );
  return () => {
    for (const t of timers) window.clearTimeout(t);
  };
}
