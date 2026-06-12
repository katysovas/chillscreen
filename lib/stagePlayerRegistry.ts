import type { RefObject } from 'react';
import { subscribeStageSync } from '@/lib/stageClock';
import type { YouTubePlayerState } from '@/lib/youtubePlayer';

/** Per-frame sync for live YouTube stage players (mute/pause when off-screen). */
const syncs = new Set<() => void>();

export function registerStagePlayerSync(sync: () => void): () => void {
  syncs.add(sync);
  return () => { syncs.delete(sync); };
}

/** Called once per game frame from SFCity's main RAF loop. */
export function runAllStagePlayerSyncs() {
  for (const sync of syncs) sync();
}

// ── Shared YouTube playerState listener (one window 'message' for all stages) ──

const YT_ORIGINS = new Set([
  'https://www.youtube.com',
  'https://www.youtube-nocookie.com',
]);

type PlayingEntry = {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onPlayingRef: RefObject<() => void>;
};

const playingEntries = new Set<PlayingEntry>();
let messageListenerOn = false;

function parsePlayingState(data: { event?: string; info?: unknown }): YouTubePlayerState | null {
  if (data?.event === 'onStateChange' && typeof data.info === 'number') {
    return data.info as YouTubePlayerState;
  }
  if (data?.event === 'infoDelivery' && typeof data.info === 'object' && data.info != null) {
    const ps = (data.info as { playerState?: unknown }).playerState;
    if (typeof ps === 'number') return ps as YouTubePlayerState;
  }
  return null;
}

function onYouTubeMessage(e: MessageEvent) {
  if (!YT_ORIGINS.has(e.origin) || !e.source) return;
  try {
    const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    const state = parsePlayingState(data);
    if (state !== 1) return;
    for (const entry of playingEntries) {
      const iframe = entry.iframeRef.current;
      if (iframe?.contentWindow && e.source === iframe.contentWindow) {
        entry.onPlayingRef.current?.();
        return;
      }
    }
  } catch {
    // Non-JSON message from another frame — ignore.
  }
}

function ensureMessageListener() {
  if (messageListenerOn) return;
  messageListenerOn = true;
  window.addEventListener('message', onYouTubeMessage);
}

function maybeRemoveMessageListener() {
  if (playingEntries.size === 0 && messageListenerOn) {
    window.removeEventListener('message', onYouTubeMessage);
    messageListenerOn = false;
  }
}

/** Route playerState=1 (playing) to the matching stage iframe. */
export function registerStagePlayerPlayingListener(
  iframeRef: RefObject<HTMLIFrameElement | null>,
  onPlayingRef: RefObject<() => void>,
): () => void {
  const entry = { iframeRef, onPlayingRef };
  playingEntries.add(entry);
  ensureMessageListener();
  return () => {
    playingEntries.delete(entry);
    maybeRemoveMessageListener();
  };
}

// ── Shared gesture / sync nudge (one listener set for all live stages) ─────────

const nudges = new Set<() => void>();
let gestureListenersOn = false;
let stageSyncUnsub: (() => void) | null = null;

function fireNudges() {
  for (const nudge of nudges) nudge();
}

/** Re-kick all live stage players (e.g. when the game becomes visible). */
export function nudgeAllStagePlayers() {
  fireNudges();
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible') fireNudges();
}

function ensureNudgeListeners() {
  if (gestureListenersOn) return;
  gestureListenersOn = true;
  window.addEventListener('pointerdown', fireNudges, { passive: true });
  window.addEventListener('keydown', fireNudges);
  document.addEventListener('visibilitychange', onVisibilityChange);
  if (!stageSyncUnsub) {
    stageSyncUnsub = subscribeStageSync(fireNudges);
  }
}

function maybeRemoveNudgeListeners() {
  if (nudges.size === 0 && gestureListenersOn) {
    window.removeEventListener('pointerdown', fireNudges);
    window.removeEventListener('keydown', fireNudges);
    document.removeEventListener('visibilitychange', onVisibilityChange);
    stageSyncUnsub?.();
    stageSyncUnsub = null;
    gestureListenersOn = false;
  }
}

/** Re-kick playback on user gesture or stage-sync handshake. */
export function registerStagePlayerNudge(nudge: () => void): () => void {
  nudges.add(nudge);
  ensureNudgeListeners();
  return () => {
    nudges.delete(nudge);
    maybeRemoveNudgeListeners();
  };
}
