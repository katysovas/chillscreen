'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { setConcertInView } from '@/lib/concertNow';
import { getAudioMuted, subscribeAudioMuted } from '@/lib/audioMute';
import { currentSchedule, useStageChannel } from '@/lib/stageClock';
import type { StageChannel } from '@/lib/stageVideos';

export type { StageVideo } from '@/lib/stageVideos';

/** Hidden-chrome, muted-autoplay embed.
 *  `startSec` is baked into the URL so the video loads from the synced
 *  position on the very first frame — no postMessage race needed. */
function embedSrc(id: string, startSec = 0): string {
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
  if (startSec > 2) params.set('start', String(Math.floor(startSec)));
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

  // ── Overlay: hide until YouTube fires playerState=1 (playing) ─────────────
  const [playerVisible, setPlayerVisible] = useState(false);

  useEffect(() => {
    if (!live) return;
    // Reset overlay whenever the video slot changes.
    setPlayerVisible(false);

    const onMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        // YouTube IFrame API: {"event":"infoDelivery","info":{"playerState":1}}
        if (data?.event === 'infoDelivery' && data?.info?.playerState === 1) {
          setPlayerVisible(true);
        }
      } catch { /* non-JSON message from another frame — ignore */ }
    };

    window.addEventListener('message', onMessage);
    // Safety fallback: reveal after 5 s even if the API message never arrives
    // (e.g. autoplay blocked, slow connection, restricted embed).
    const fallback = setTimeout(() => setPlayerVisible(true), 5000);

    return () => {
      window.removeEventListener('message', onMessage);
      clearTimeout(fallback);
    };
  }, [vidKey, live]);

  // Bake the current synced offset into the URL when the iframe is (re)mounted.
  // Recomputes only when the video or vidKey changes (i.e. on rotation), so the
  // same `src` string is stable across unrelated re-renders and won't reload the
  // iframe unnecessarily.
  const src = useMemo(() => {
    if (!video) return '';
    const sched = currentSchedule(channel);
    return embedSrc(video.id, sched?.offsetSec ?? 0);
  // vidKey bumps on each rotation — that's when we want a fresh start offset.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video?.id, vidKey, channel]);

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
    // Belt-and-suspenders: ensure the player is playing and apply mute state.
    // The start position is already handled by the `start=N` URL param.
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

  return { video, src, vidKey, onIframeLoad, playerVisible };
}
