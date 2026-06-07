'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { getAudioMuted, subscribeAudioMuted } from '@/lib/audioMute';
import { currentSchedule, subscribeStageSync, useStageChannel } from '@/lib/stageClock';
import type { StageChannel } from '@/lib/stageVideos';
import { gameWorldOffRef } from '@/lib/gameWorldRef';
import { anyStageInView } from '@/lib/venues';
import {
  applyYouTubeAudio,
  nudgeYouTubePlayback,
  postCommand,
  primeYouTubePlayback,
  scheduleYouTubePlaybackKicks,
  stageEmbedSrc,
  stopYouTubePlayback,
} from '@/lib/youtubePlayer';

export type { StageVideo } from '@/lib/stageVideos';

/** Hidden-chrome, muted-autoplay embed — see stageEmbedSrc. */
function embedSrc(id: string, startSec = 0): string {
  return stageEmbedSrc(id, startSec);
}

export const STAGE_IFRAME_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 'none',
  pointerEvents: 'none',
  display: 'block',
};

type UseStagePlayerOptions = {
  live: boolean;
  /** Synchronized playback channel — picks the shared, pinned playlist. */
  channel: StageChannel;
  /** The player <iframe> (rendered declaratively by the caller). */
  iframeRef: RefObject<HTMLIFrameElement | null>;
  /** Called with the current video title (or null) while this stage is live. */
  onNowPlaying?: (title: string | null) => void;
};

type UseStagePlayerResult = {
  video: import('@/lib/stageVideos').StageVideo | undefined;
  /** iframe src — empty string when nothing should be mounted. */
  src: string;
  /** Forces a fresh iframe element on each video change. */
  vidKey: number;
  /** Wire to the iframe's onLoad — kicks playback and applies mute state. */
  onIframeLoad: () => void;
  /**
   * False while YouTube's player is still initializing (controls / branding
   * flash may be visible). Flips to true the moment YouTube fires playerState=1
   * (playing), or after a 5 s safety timeout. Use this to drive an overlay that
   * hides the iframe until it is cleanly playing.
   */
  playerVisible: boolean;
};

/**
 * Shared concert/festival YouTube logic. Renders a plain (declarative) iframe
 * — reliable inside SVG <foreignObject> — that autoplays muted so it never
 * sits black or shows the center play button.
 *
 * The current synced position is baked into the embed URL (`start=N`) when the
 * iframe is mounted, so every user who loads the page sees the video at the
 * same timestamp with no postMessage race conditions. The video + schedule come
 * from the shared, server-pinned playlist (`@/lib/stageClock`).
 */
export function useStagePlayer({
  live, channel, iframeRef, onNowPlaying,
}: UseStagePlayerOptions): UseStagePlayerResult {
  const { video, vidKey } = useStageChannel(channel, live);

  const [siteMuted, setSiteMuted] = useState(false);
  const siteMutedRef = useRef(siteMuted);
  siteMutedRef.current = siteMuted;

  const [playerVisible, setPlayerVisible] = useState(false);
  const playerVisibleRef = useRef(false);
  playerVisibleRef.current = playerVisible;

  const stageInViewRef = useRef(true);
  const kickCancelRef = useRef<(() => void) | null>(null);

  const isStageInView = useCallback(
    () => anyStageInView(gameWorldOffRef.current),
    [],
  );

  const syncStageToView = useCallback(() => {
    const inView = isStageInView();
    stageInViewRef.current = inView;
    const f = iframeRef.current;
    if (!f) return;
    if (!inView) {
      kickCancelRef.current?.();
      kickCancelRef.current = null;
      stopYouTubePlayback(f);
    } else if (playerVisibleRef.current) {
      postCommand(f, 'playVideo');
      applyYouTubeAudio(f, siteMutedRef.current);
    }
  }, [iframeRef, isStageInView]);

  useEffect(() => {
    if (!live) return;
    setPlayerVisible(false);

    const onMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (data?.event === 'infoDelivery' && data?.info?.playerState === 1) {
          setPlayerVisible(true);
          if (stageInViewRef.current) {
            applyYouTubeAudio(iframeRef.current, siteMutedRef.current);
          } else {
            stopYouTubePlayback(iframeRef.current);
          }
        }
      } catch { /* non-JSON message from another frame — ignore */ }
    };

    window.addEventListener('message', onMessage);
    const fallback = setTimeout(() => {
      setPlayerVisible(true);
      if (stageInViewRef.current) {
        applyYouTubeAudio(iframeRef.current, siteMutedRef.current);
      } else {
        stopYouTubePlayback(iframeRef.current);
      }
    }, 5000);

    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(fallback);
    };
  }, [vidKey, live, iframeRef]);

  const [src, setSrc] = useState('');
  useEffect(() => {
    if (!live || !video) {
      setSrc('');
      return;
    }
    const sched = currentSchedule(channel);
    setSrc(embedSrc(video.id, sched?.offsetSec ?? 0));
  }, [live, video?.id, vidKey, channel]);

  const restoreAudio = useCallback(() => {
    if (!stageInViewRef.current || !playerVisibleRef.current) return;
    applyYouTubeAudio(iframeRef.current, siteMutedRef.current);
  }, [iframeRef]);

  const nudgePlayback = useCallback(() => {
    if (!stageInViewRef.current) return;
    nudgeYouTubePlayback(iframeRef.current);
    restoreAudio();
  }, [iframeRef, restoreAudio]);

  useEffect(() => {
    if (!live || !src) return;
    kickCancelRef.current?.();
    kickCancelRef.current = scheduleYouTubePlaybackKicks(iframeRef.current);
    const afterPaint = requestAnimationFrame(() => {
      if (!stageInViewRef.current) return;
      kickCancelRef.current?.();
      kickCancelRef.current = scheduleYouTubePlaybackKicks(iframeRef.current);
    });
    return () => {
      cancelAnimationFrame(afterPaint);
      kickCancelRef.current?.();
      kickCancelRef.current = null;
    };
  }, [live, src, vidKey, iframeRef]);

  // Re-kick when sync handshake arrives or user interacts (autoplay policy).
  useEffect(() => {
    if (!live || !src) return;
    const onSync = () => nudgePlayback();
    const onGesture = () => nudgePlayback();
    const unsub = subscribeStageSync(onSync);
    window.addEventListener('pointerdown', onGesture, { passive: true });
    window.addEventListener('keydown', onGesture);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') nudgePlayback();
    });
    return () => {
      unsub();
      window.removeEventListener('pointerdown', onGesture);
      window.removeEventListener('keydown', onGesture);
    };
  }, [live, src, vidKey, nudgePlayback]);

  useEffect(() => {
    setSiteMuted(getAudioMuted());
    return subscribeAudioMuted(() => setSiteMuted(getAudioMuted()));
  }, []);

  const onNowPlayingRef = useRef(onNowPlaying);
  onNowPlayingRef.current = onNowPlaying;
  useEffect(() => {
    if (!live) return;
    return () => { onNowPlayingRef.current?.(null); };
  }, [live]);

  useEffect(() => {
    if (live) onNowPlayingRef.current?.(video?.title ?? null);
  }, [live, video?.title]);

  const onIframeLoad = useCallback(() => {
    if (!stageInViewRef.current) return;
    primeYouTubePlayback(iframeRef.current);
  }, [iframeRef]);

  // Only adjust audio after playback has started — unmuting too early breaks autoplay.
  useEffect(() => {
    if (!playerVisible || !stageInViewRef.current) return;
    applyYouTubeAudio(iframeRef.current, siteMuted);
  }, [siteMuted, playerVisible, iframeRef]);

  useEffect(() => {
    if (live) return;
    kickCancelRef.current?.();
    kickCancelRef.current = null;
    stopYouTubePlayback(iframeRef.current);
  }, [live, iframeRef]);

  useEffect(() => {
    if (!live) return;
    syncStageToView();
    const id = setInterval(syncStageToView, 200);
    return () => clearInterval(id);
  }, [live, syncStageToView]);

  return { video, src, vidKey, onIframeLoad, playerVisible };
}
