'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { getAudioMuted, subscribeAudioMuted } from '@/lib/audioMute';
import type { UserStagePublic } from '@/lib/stages/types';
import { nowPlayingStream } from '@/lib/stages/runtime';
import { streamChannelMarquee } from '@/lib/stages/streamLabel';
import { registerStagePlayerNudge, registerStagePlayerPlayingListener } from '@/lib/stagePlayerRegistry';
import {
  applyYouTubeAudio,
  nudgeYouTubePlayback,
  primeYouTubePlayback,
  resetYouTubePlayerState,
  scheduleYouTubePlaybackKicks,
  stageEmbedSrc,
} from '@/lib/youtubePlayer';

export const CREATOR_STAGE_IFRAME_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 'none',
  display: 'block',
};

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

type UseCreatorStagePlayerOptions = {
  live: boolean;
  stage: UserStagePublic;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  onNowPlaying?: (title: string | null) => void;
  alwaysMuted?: boolean;
  enabled?: boolean;
};

type UseCreatorStagePlayerResult = {
  stream: ReturnType<typeof nowPlayingStream>;
  src: string;
  vidKey: number;
  onIframeLoad: () => void;
};

/** Single now-playing embed for user-created stages — no synced playlist clock. */
export function useCreatorStagePlayer({
  live,
  stage,
  iframeRef,
  onNowPlaying,
  alwaysMuted = false,
  enabled = true,
}: UseCreatorStagePlayerOptions): UseCreatorStagePlayerResult {
  const stream = useMemo(() => (enabled ? nowPlayingStream(stage) : null), [enabled, stage]);
  const vidKey = stage.nowPlayingIndex * 10_000 + (stream?.videoId ?? '').length;
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

  const onNowPlayingRef = useRef(onNowPlaying);
  onNowPlayingRef.current = onNowPlaying;

  const src = useMemo(() => {
    if (!enabled || !live || !embedReady || !stream) return '';
    return stageEmbedSrc(stream.videoId, 0);
  }, [enabled, live, embedReady, stream?.videoId, vidKey]);

  useEffect(() => {
    if (!live || !stream) {
      onNowPlayingRef.current?.(null);
      return;
    }
    onNowPlayingRef.current?.(stream ? streamChannelMarquee(stream) || null : null);
  }, [live, stream?.videoId, stream?.channelTitle, stream?.title]);

  const onPlayingRef = useRef<() => void>(() => {});

  useEffect(() => {
    if (!live || !src) return;
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
    return registerStagePlayerNudge(nudgePlayback);
  }, [live, src, vidKey, nudgePlayback]);

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
    scheduleYouTubePlaybackKicks(iframe);
    for (const ms of [300, 800, 2000, 4000, 6000]) {
      window.setTimeout(() => applyAudio(iframe), ms);
    }
  }, [iframeRef, applyAudio, live, src]);

  useEffect(() => {
    if (!live) return;
    return () => { onNowPlayingRef.current?.(null); };
  }, [live]);

  return { stream: live ? stream : null, src, vidKey, onIframeLoad };
}
