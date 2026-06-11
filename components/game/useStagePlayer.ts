'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { getAudioMuted, subscribeAudioMuted } from '@/lib/audioMute';
import { currentSchedule, subscribeStageSync, useStageChannel } from '@/lib/stageClock';
import type { StageChannel, StageVideo } from '@/lib/stageVideos';
import { registerStagePlayerNudge, registerStagePlayerPlayingListener } from '@/lib/stagePlayerRegistry';
import {
  applyYouTubeAudio,
  nudgeYouTubePlayback,
  primeYouTubePlayback,
  scheduleYouTubePlaybackKicks,
  stageEmbedSrc,
} from '@/lib/youtubePlayer';

export type { StageVideo } from '@/lib/stageVideos';

export const STAGE_IFRAME_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 'none',
  pointerEvents: 'none',
  display: 'block',
};

type UseStagePlayerOptions = {
  live: boolean;
  channel: StageChannel;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onNowPlaying?: (title: string | null) => void;
  alwaysMuted?: boolean;
};

type UseStagePlayerResult = {
  video: StageVideo | undefined;
  src: string;
  vidKey: number;
  onIframeLoad: () => void;
  playerVisible: boolean;
};

/**
 * YouTube stage player for isolated-city pages — one live channel per URL.
 * When `live`, the iframe mounts immediately and autoplays on page load.
 */
export function useStagePlayer({
  live, channel, iframeRef, onNowPlaying, alwaysMuted = false,
}: UseStagePlayerOptions): UseStagePlayerResult {
  const { video, vidKey } = useStageChannel(channel, live);

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

  const kickCancelRef = useRef<(() => void) | null>(null);
  const onPlayingRef = useRef<() => void>(() => {});
  const onNowPlayingRef = useRef(onNowPlaying);
  onNowPlayingRef.current = onNowPlaying;

  const src = useMemo(() => {
    if (!live || !video) return '';
    const sched = currentSchedule(channel);
    const url = stageEmbedSrc(video.id, sched?.offsetSec ?? 0);
    console.log(`[${channel}] embed`, video.id, video.title, sched?.offsetSec ?? 0, url);
    return url;
  }, [live, video?.id, video?.title, channel, vidKey]);

  useEffect(() => {
    if (!live || !video) {
      onNowPlayingRef.current?.(null);
      return;
    }
    onNowPlayingRef.current?.(video.title ?? null);
  }, [live, video?.id, video?.title]);

  onPlayingRef.current = () => {
    setPlayerVisible(true);
    applyAudio(iframeRef.current);
  };

  useEffect(() => {
    if (!live || !src) return;
    setPlayerVisible(false);

    const unregister = registerStagePlayerPlayingListener(iframeRef, onPlayingRef);
    const fallback = setTimeout(() => onPlayingRef.current(), 5000);

    return () => {
      unregister();
      clearTimeout(fallback);
    };
  }, [vidKey, live, src, iframeRef]);

  const nudgePlayback = useCallback(() => {
    if (!live || !src) return;
    nudgeYouTubePlayback(iframeRef.current);
    if (playerVisibleRef.current) applyAudio(iframeRef.current);
  }, [live, src, iframeRef, applyAudio]);

  useEffect(() => {
    if (!live || !src) return;

    let cancelled = false;
    const armKicks = () => {
      if (cancelled) return;
      const iframe = iframeRef.current;
      if (!iframe) {
        requestAnimationFrame(armKicks);
        return;
      }
      primeYouTubePlayback(iframe);
      kickCancelRef.current?.();
      kickCancelRef.current = scheduleYouTubePlaybackKicks(iframe);
    };
    armKicks();

    return () => {
      cancelled = true;
      kickCancelRef.current?.();
      kickCancelRef.current = null;
    };
  }, [live, src, vidKey, iframeRef]);

  useEffect(() => {
    if (!live || !src) return;
    return registerStagePlayerNudge(nudgePlayback);
  }, [live, src, vidKey, nudgePlayback]);

  useEffect(() => {
    if (!live || !src) return;
    return subscribeStageSync(nudgePlayback);
  }, [live, src, nudgePlayback]);

  useEffect(() => {
    if (alwaysMuted) return;
    setSiteMuted(getAudioMuted());
    return subscribeAudioMuted(() => setSiteMuted(getAudioMuted()));
  }, [alwaysMuted]);

  const onIframeLoad = useCallback(() => {
    primeYouTubePlayback(iframeRef.current);
  }, [iframeRef]);

  useEffect(() => {
    if (!playerVisible) return;
    applyAudio(iframeRef.current);
  }, [siteMuted, playerVisible, iframeRef, applyAudio, alwaysMuted]);

  useEffect(() => {
    if (!live) return;
    return () => { onNowPlayingRef.current?.(null); };
  }, [live]);

  return { video: live ? video : undefined, src, vidKey, onIframeLoad, playerVisible };
}
