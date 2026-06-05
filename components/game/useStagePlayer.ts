'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { setConcertInView } from '@/lib/concertNow';
import { getAudioMuted, subscribeAudioMuted } from '@/lib/audioMute';
import { useStageChannel } from '@/lib/stageClock';
import type { StageChannel } from '@/lib/stageVideos';

export type { StageVideo } from '@/lib/stageVideos';

/** Hidden-chrome, muted-autoplay embed (autoplay is always allowed when muted,
 *  so the big center play button never shows and the frame never sits black). */
function embedSrc(id: string): string {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    controls: '0',
    rel: '0',
    modestbranding: '1',
    iv_load_policy: '3',
    fs: '0',
    disablekb: '1',
    playsinline: '1',
    loop: '1',
    playlist: id,
    enablejsapi: '1',
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}

/** Send a command to a YouTube embed via the IFrame API postMessage protocol. */
function postCommand(iframe: HTMLIFrameElement | null, func: string, args: unknown[] = []) {
  iframe?.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args }),
    '*',
  );
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
  /** Wire to the iframe's onLoad — kicks playback, seeks to the shared
   *  position, and applies mute state. */
  onIframeLoad: () => void;
};

/**
 * Shared concert/festival YouTube logic. Renders a plain (declarative) iframe
 * — reliable inside SVG <foreignObject> — that autoplays muted so it never
 * sits black or shows the center play button, then seeks to the synchronized
 * position and unmutes via postMessage once loaded (unless the site is muted).
 *
 * The video + position come from the shared, server-pinned schedule
 * (`@/lib/stageClock`), so every connected user sees the same video at the same
 * time. The stage also marks itself "in view" so website + stage audio never
 * overlap.
 */
export function useStagePlayer({
  live, channel, iframeRef, onNowPlaying,
}: UseStagePlayerOptions): UseStagePlayerResult {
  const { video, vidKey } = useStageChannel(channel, live);
  const src = video ? embedSrc(video.id) : '';

  const [siteMuted, setSiteMuted] = useState(false);
  const siteMutedRef = useRef(siteMuted);
  siteMutedRef.current = siteMuted;

  useEffect(() => {
    setSiteMuted(getAudioMuted());
    return subscribeAudioMuted(() => setSiteMuted(getAudioMuted()));
  }, []);

  // Mark the stage in view (pauses website audio) + report now-playing, but
  // only the live instance touches the shared flag so siblings can't clobber it.
  const onNowPlayingRef = useRef(onNowPlaying);
  onNowPlayingRef.current = onNowPlaying;
  useEffect(() => {
    if (!live) return;
    setConcertInView(true);
    return () => {
      setConcertInView(false);
      onNowPlayingRef.current?.(null);
    };
  }, [live]);

  useEffect(() => {
    if (live) onNowPlayingRef.current?.(video?.title ?? null);
  }, [live, video?.title]);

  const onIframeLoad = useCallback(() => {
    const f = iframeRef.current;
    postCommand(f, 'playVideo');
    if (siteMutedRef.current) {
      postCommand(f, 'mute');
    } else {
      postCommand(f, 'unMute');
      postCommand(f, 'setVolume', [55]);
    }
  }, [iframeRef]);

  // React to the site mute toggle on the loaded iframe.
  useEffect(() => {
    const f = iframeRef.current;
    if (!f) return;
    if (siteMuted) {
      postCommand(f, 'mute');
    } else {
      postCommand(f, 'unMute');
      postCommand(f, 'setVolume', [55]);
    }
  }, [siteMuted, iframeRef]);

  return { video, src, vidKey, onIframeLoad };
}
