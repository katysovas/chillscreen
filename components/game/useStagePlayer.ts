'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { getAudioMuted, subscribeAudioMuted } from '@/lib/audioMute';
import { currentSchedule, useStageChannel } from '@/lib/stageClock';
import type { StageChannel, StageVideo } from '@/lib/stageVideos';
import { gameWorldOffRef } from '@/lib/gameWorldRef';
import { isStageChannelInView } from '@/lib/venues';
import { registerStagePlayerNudge, registerStagePlayerPlayingListener, registerStagePlayerSync } from '@/lib/stagePlayerRegistry';
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
  /** Ignore the global mute toggle — cinema stays silent. */
  alwaysMuted?: boolean;
};

type UseStagePlayerResult = {
  video: StageVideo | undefined;
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
 * The iframe only mounts while the stage channel is in view — off-screen live
 * slots render the static shell with zero embed cost.
 */
export function useStagePlayer({
  live, channel, iframeRef, onNowPlaying, alwaysMuted = false,
}: UseStagePlayerOptions): UseStagePlayerResult {
  const { video, vidKey } = useStageChannel(channel, live);
  const videoRef = useRef(video);
  videoRef.current = video;

  const [siteMuted, setSiteMuted] = useState(false);
  const siteMutedRef = useRef(siteMuted);
  siteMutedRef.current = siteMuted;

  const audioMuted = useCallback(
    () => alwaysMuted || siteMutedRef.current,
    [alwaysMuted],
  );

  const applyAudio = useCallback(
    (iframe: HTMLIFrameElement | null) => {
      applyYouTubeAudio(iframe, audioMuted());
    },
    [audioMuted],
  );

  const [playerVisible, setPlayerVisible] = useState(false);
  const playerVisibleRef = useRef(false);
  playerVisibleRef.current = playerVisible;

  const stageInViewRef = useRef(false);
  const iframeMountedRef = useRef(false);
  const kickCancelRef = useRef<(() => void) | null>(null);
  const onPlayingRef = useRef<() => void>(() => {});
  const onNowPlayingRef = useRef(onNowPlaying);
  onNowPlayingRef.current = onNowPlaying;

  const isStageInView = useCallback(
    () => isStageChannelInView(channel, gameWorldOffRef.current),
    [channel],
  );

  const [src, setSrc] = useState('');

  const unmountIframe = useCallback(() => {
    if (!iframeMountedRef.current) return;
    iframeMountedRef.current = false;
    kickCancelRef.current?.();
    kickCancelRef.current = null;
    stopYouTubePlayback(iframeRef.current);
    setSrc('');
    setPlayerVisible(false);
    onNowPlayingRef.current?.(null);
  }, [iframeRef]);

  const mountIframe = useCallback(() => {
    const v = videoRef.current;
    if (!v || iframeMountedRef.current) return;
    iframeMountedRef.current = true;
    setPlayerVisible(false);
    const sched = currentSchedule(channel);
    const url = embedSrc(v.id, sched?.offsetSec ?? 0);
    console.log(`[${channel}] embed`, v.id, v.title, sched?.offsetSec ?? 0, url);
    setSrc(url);
    onNowPlayingRef.current?.(v.title ?? null);
  }, [channel]);

  const syncStageToView = useCallback(() => {
    if (!live || !videoRef.current) {
      stageInViewRef.current = false;
      unmountIframe();
      return;
    }

    const inView = isStageInView();
    stageInViewRef.current = inView;

    if (!inView) {
      unmountIframe();
      return;
    }

    if (!iframeMountedRef.current) {
      mountIframe();
      return;
    }

    const f = iframeRef.current;
    if (f && playerVisibleRef.current) {
      postCommand(f, 'playVideo');
      applyAudio(f);
    }
  }, [live, isStageInView, unmountIframe, mountIframe, iframeRef, applyAudio]);

  onPlayingRef.current = () => {
    setPlayerVisible(true);
    if (stageInViewRef.current) {
      applyAudio(iframeRef.current);
    } else {
      stopYouTubePlayback(iframeRef.current);
    }
  };

  useEffect(() => {
    if (!live) return;
    setPlayerVisible(false);

    const unregister = registerStagePlayerPlayingListener(iframeRef, onPlayingRef);
    const fallback = setTimeout(() => onPlayingRef.current(), 5000);

    return () => {
      unregister();
      clearTimeout(fallback);
    };
  }, [vidKey, live, iframeRef]);

  useEffect(() => {
    unmountIframe();
    if (live) syncStageToView();
  }, [vidKey, live, channel, video?.id, unmountIframe, syncStageToView]);

  const restoreAudio = useCallback(() => {
    if (!stageInViewRef.current || !playerVisibleRef.current) return;
    applyAudio(iframeRef.current);
  }, [iframeRef, applyAudio]);

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

  useEffect(() => {
    if (!live || !src) return;
    return registerStagePlayerNudge(nudgePlayback);
  }, [live, src, vidKey, nudgePlayback]);

  useEffect(() => {
    if (alwaysMuted) return;
    setSiteMuted(getAudioMuted());
    return subscribeAudioMuted(() => setSiteMuted(getAudioMuted()));
  }, [alwaysMuted]);

  useEffect(() => {
    if (!live) return;
    return () => { onNowPlayingRef.current?.(null); };
  }, [live]);

  useEffect(() => {
    if (live && iframeMountedRef.current && stageInViewRef.current) {
      onNowPlayingRef.current?.(video?.title ?? null);
    }
  }, [live, video?.title]);

  const onIframeLoad = useCallback(() => {
    if (!stageInViewRef.current) return;
    primeYouTubePlayback(iframeRef.current);
  }, [iframeRef]);

  useEffect(() => {
    if (!playerVisible || !stageInViewRef.current) return;
    applyAudio(iframeRef.current);
  }, [siteMuted, playerVisible, iframeRef, applyAudio, alwaysMuted]);

  useEffect(() => {
    if (live) return;
    unmountIframe();
  }, [live, unmountIframe]);

  useEffect(() => {
    if (!live) return;
    return registerStagePlayerSync(syncStageToView);
  }, [live, syncStageToView]);

  useEffect(() => {
    if (!live) return;
    return () => {
      unmountIframe();
    };
  }, [live, unmountIframe]);

  return { video, src, vidKey, onIframeLoad, playerVisible };
}
