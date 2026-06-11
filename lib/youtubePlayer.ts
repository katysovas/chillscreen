/** Shared YouTube embed helpers for stage/cinema players. Client-only. */

const YT_ORIGINS = new Set([
  'https://www.youtube.com',
  'https://www.youtube-nocookie.com',
]);

/** Flush queued commands if onReady never arrives (ad blockers, slow loads). */
const READY_FALLBACK_MS = 5_000;

type QueuedCommand = { func: string; args: unknown[] };

type WidgetState = {
  ready: boolean;
  listeningArmed: boolean;
  queue: QueuedCommand[];
  fallbackTimer: number | null;
};

const widgetState = new WeakMap<HTMLIFrameElement, WidgetState>();
const sourceToIframe = new Map<MessageEventSource, HTMLIFrameElement>();

let messageListenerOn = false;

function stateFor(iframe: HTMLIFrameElement): WidgetState {
  let state = widgetState.get(iframe);
  if (!state) {
    state = {
      ready: false,
      listeningArmed: false,
      queue: [],
      fallbackTimer: null,
    };
    widgetState.set(iframe, state);
  }
  return state;
}

function ensureMessageListener() {
  if (messageListenerOn) return;
  messageListenerOn = true;
  window.addEventListener('message', onWidgetMessage);
}

function onWidgetMessage(e: MessageEvent) {
  if (!YT_ORIGINS.has(e.origin) || !e.source) return;
  try {
    const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    if (data?.event !== 'onReady') return;
    const iframe = sourceToIframe.get(e.source);
    if (iframe) markWidgetReady(iframe);
  } catch {
    // Non-JSON postMessage from another frame.
  }
}

function markWidgetReady(iframe: HTMLIFrameElement) {
  const state = stateFor(iframe);
  if (state.ready) return;
  state.ready = true;
  if (state.fallbackTimer != null) {
    clearTimeout(state.fallbackTimer);
    state.fallbackTimer = null;
  }
  flushQueuedCommands(iframe, state);
}

function flushQueuedCommands(iframe: HTMLIFrameElement, state: WidgetState) {
  const win = iframe.contentWindow;
  if (!win) return;
  for (const { func, args } of state.queue) {
    win.postMessage(
      JSON.stringify({ event: 'command', func, args }),
      '*',
    );
  }
  state.queue = [];
}

function sendListening(iframe: HTMLIFrameElement) {
  const win = iframe.contentWindow;
  if (!win) return;
  sourceToIframe.set(win, iframe);
  win.postMessage(
    JSON.stringify({ event: 'listening', id: 1, channel: 'widget' }),
    '*',
  );
}

function ensureListening(iframe: HTMLIFrameElement) {
  ensureMessageListener();
  const state = stateFor(iframe);
  if (state.listeningArmed) return;
  state.listeningArmed = true;
  sendListening(iframe);
  if (state.fallbackTimer == null) {
    state.fallbackTimer = window.setTimeout(
      () => markWidgetReady(iframe),
      READY_FALLBACK_MS,
    );
  }
}

/** Reset widget handshake — call when a fresh iframe document loads. */
function prepareWidget(iframe: HTMLIFrameElement) {
  const state = stateFor(iframe);
  state.ready = false;
  state.listeningArmed = false;
  state.queue = [];
  if (state.fallbackTimer != null) {
    clearTimeout(state.fallbackTimer);
    state.fallbackTimer = null;
  }
  ensureListening(iframe);
}

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
  if (!iframe?.contentWindow) return;
  const state = stateFor(iframe);
  if (!state.ready) {
    state.queue.push({ func, args });
    ensureListening(iframe);
    return;
  }
  iframe.contentWindow.postMessage(
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
  prepareWidget(iframe);
  postCommand(iframe, 'mute');
  postCommand(iframe, 'playVideo');
}

/** Resume playback without re-muting (gestures, sync, retries). */
export function nudgeYouTubePlayback(iframe: HTMLIFrameElement | null) {
  if (!iframe?.contentWindow) return;
  ensureListening(iframe);
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

/** Hard stop — mute + pause so off-screen players cannot leak chopped audio. */
export function stopYouTubePlayback(iframe: HTMLIFrameElement | null) {
  if (!iframe) return;
  postCommand(iframe, 'mute');
  postCommand(iframe, 'pauseVideo');
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
