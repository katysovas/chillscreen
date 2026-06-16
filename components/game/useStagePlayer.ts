'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { getAudioMuted, subscribeAudioMuted } from '@/lib/audioMute';
import { useOptionalCreatorStage } from '@/lib/stages/CreatorStageContext';
import { currentSchedule, subscribeStageSync, useStageChannel } from '@/lib/stageClock';
import type { StageChannel, StageVideo } from '@/lib/stageVideos';
import { registerStagePlayerNudge, registerStagePlayerPlayingListener } from '@/lib/stagePlayerRegistry';
import {
  applyYouTubeAudio,
  nudgeYouTubePlayback,
  primeYouTubePlayback,
  resetYouTubePlayerState,
  scheduleYouTubePlaybackKicks,
  stageEmbedSrc,
} from '@/lib/youtubePlayer';
import { useCreatorStagePlayer } from './useCreatorStagePlayer';
import type { UserStagePublic } from '@/lib/stages/types';

export type { StageVideo } from '@/lib/stageVideos';

export const STAGE_IFRAME_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 'none',
  display: 'block',
};

/** Defer YouTube embed until after first paint + idle — keeps PSI main-thread budget for game boot. */
const YOUTUBE_EMBED_IDLE_TIMEOUT_MS = 4_000;

function scheduleYouTubeEmbed(onReady: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(onReady, { timeout: YOUTUBE_EMBED_IDLE_TIMEOUT_MS });
    return () => window.cancelIdleCallback(id);
  }
  const id = globalThis.setTimeout(onReady, 1_500);
  return () => globalThis.clearTimeout(id);
}

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
};

const EMPTY_CREATOR_STAGE: UserStagePublic = {
  slug: '',
  displayName: '',
  ownerId: '',
  festieId: '',
  preset: 'chill',
  streams: [],
  nowPlayingIndex: 0,
  createdAt: 0,
  lastActiveAt: 0,
  tier: 'active',
  takenDown: false,
};

function useSyncedStagePlayer({
  live, channel, iframeRef, onNowPlaying, alwaysMuted = false, enabled = true,
}: UseStagePlayerOptions & { enabled?: boolean }): UseStagePlayerResult {
  const { video, vidKey } = useStageChannel(channel, live && enabled);
  const [embedReady, setEmbedReady] = useState(false);

  useEffect(() => {
    if (!enabled || !live) {
      setEmbedReady(false);
      return;
    }
    setEmbedReady(false);
    return scheduleYouTubeEmbed(() => setEmbedReady(true));
  }, [enabled, live, vidKey]);

  const applyAudio = useCallback(
    (iframe: HTMLIFrameElement | null) => {
      applyYouTubeAudio(iframe, alwaysMuted || getAudioMuted());
    },
    [alwaysMuted],
  );

  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  playingRef.current = playing;

  const kickCancelRef = useRef<(() => void) | null>(null);
  const onPlayingRef = useRef<() => void>(() => {});
  const onNowPlayingRef = useRef(onNowPlaying);
  onNowPlayingRef.current = onNowPlaying;

  const src = useMemo(() => {
    if (!enabled || !live || !embedReady || !video) return '';
    const sched = currentSchedule(channel);
    const url = stageEmbedSrc(video.id, sched?.offsetSec ?? 0);
    console.log(`[${channel}] embed`, video.id, video.title, sched?.offsetSec ?? 0, url);
    return url;
  }, [enabled, live, embedReady, video?.id, video?.title, channel, vidKey]);

  useEffect(() => {
    if (!live || !video) {
      onNowPlayingRef.current?.(null);
      return;
    }
    onNowPlayingRef.current?.(video.title ?? null);
  }, [live, video?.id, video?.title]);

  onPlayingRef.current = () => {
    playingRef.current = true;
    setPlaying(true);
    applyAudio(iframeRef.current);
  };

  useEffect(() => {
    if (!live || !src) return;
    playingRef.current = false;
    setPlaying(false);

    const unregister = registerStagePlayerPlayingListener(iframeRef, onPlayingRef);
    const fallback = window.setTimeout(() => onPlayingRef.current(), 5000);

    return () => {
      unregister();
      window.clearTimeout(fallback);
    };
  }, [vidKey, live, src, iframeRef]);

  const nudgePlayback = useCallback(() => {
    if (!live || !src) return;
    nudgeYouTubePlayback(iframeRef.current);
    applyAudio(iframeRef.current);
  }, [live, src, iframeRef, applyAudio]);

  useEffect(() => {
    if (!live || !src) return;

    return () => {
      kickCancelRef.current?.();
      kickCancelRef.current = null;
      resetYouTubePlayerState(iframeRef.current);
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
    const syncMute = () => applyAudio(iframeRef.current);
    syncMute();
    return subscribeAudioMuted(syncMute);
  }, [alwaysMuted, applyAudio, iframeRef]);

  const onIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe || !live || !src) return;
    resetYouTubePlayerState(iframe);
    primeYouTubePlayback(iframe);
    kickCancelRef.current?.();
    kickCancelRef.current = scheduleYouTubePlaybackKicks(iframe);
    for (const ms of [300, 800, 2000, 4000, 6000]) {
      window.setTimeout(() => applyAudio(iframe), ms);
    }
  }, [iframeRef, applyAudio, live, src]);

  useEffect(() => {
    if (!playing) return;
    applyAudio(iframeRef.current);
  }, [playing, iframeRef, applyAudio]);

  useEffect(() => {
    if (!live) return;
    return () => { onNowPlayingRef.current?.(null); };
  }, [live]);

  return { video: live && enabled ? video : undefined, src, vidKey, onIframeLoad };
}

/**
 * YouTube stage player for isolated-city pages — one live channel per URL.
 * When `live`, the iframe mounts immediately and autoplays on page load.
 * User-created stages use lineup now-playing via CreatorStageContext.
 */
export function useStagePlayer(opts: UseStagePlayerOptions): UseStagePlayerResult {
  const creatorStage = useOptionalCreatorStage();
  const creator = useCreatorStagePlayer({
    live: opts.live,
    stage: creatorStage ?? EMPTY_CREATOR_STAGE,
    iframeRef: opts.iframeRef,
    onNowPlaying: opts.onNowPlaying,
    alwaysMuted: opts.alwaysMuted,
    enabled: Boolean(creatorStage),
  });
  const synced = useSyncedStagePlayer({ ...opts, enabled: !creatorStage });

  if (creatorStage) {
    const stream = creator.stream;
    const video: StageVideo | undefined = stream
      ? {
        id: stream.videoId,
        title: stream.title,
        durationSec: stream.durationSec ?? undefined,
      }
      : undefined;
    return {
      video: opts.live ? video : undefined,
      src: creator.src,
      vidKey: creator.vidKey,
      onIframeLoad: creator.onIframeLoad,
    };
  }

  return synced;
}
