import type { RefObject } from 'react';
import { subscribeStageSync } from '@/lib/stageClock';

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

type PlayingEntry = {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onPlayingRef: RefObject<() => void>;
};

const playingEntries = new Set<PlayingEntry>();
let messageListenerOn = false;

function onYouTubeMessage(e: MessageEvent) {
  try {
    const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
    if (data?.event !== 'infoDelivery' || data?.info?.playerState !== 1) return;
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
