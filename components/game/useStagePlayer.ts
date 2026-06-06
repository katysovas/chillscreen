'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { setConcertInView } from '@/lib/concertNow';
import { getAudioMuted, subscribeAudioMuted } from '@/lib/audioMute';
import { currentSchedule, useStageChannel } from '@/lib/stageClock';
import type { StageChannel } from '@/lib/stageVideos';
import { gameWorldOffRef } from '@/lib/gameWorldRef';
import { anyStageInView } from '@/lib/venues';
import {
  kickYouTubePlayback,
  postCommand,
  scheduleYouTubePlaybackKicks,
  stageEmbedSrc,
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

  // Embed URL depends on syncedNow() — set after mount to avoid SSR/client mismatch.
  const [src, setSrc] = useState('');
  useEffect(() => {
    if (!live || !video) {
      setSrc('');
      return;
    }
    const sched = currentSchedule(channel);
    setSrc(embedSrc(video.id, sched?.offsetSec ?? 0));
  }, [live, video?.id, vidKey, channel]);

  // Retry play after src is set — onLoad alone is often too early for YouTube.
  useEffect(() => {
    if (!live || !src) return;
    let cancelRetries = scheduleYouTubePlaybackKicks(iframeRef.current);
    const afterPaint = requestAnimationFrame(() => {
      cancelRetries();
      cancelRetries = scheduleYouTubePlaybackKicks(iframeRef.current);
    });
    return () => {
      cancelAnimationFrame(afterPaint);
      cancelRetries();
    };
  }, [live, src, vidKey, iframeRef]);

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
    kickYouTubePlayback(f);
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

  // Stop stage video audio when the player walks off screen from the stage.
  // The Concert component can stay mounted (stale vx in MidLayer's memoized
  // renderTile closure), so we poll the live world offset directly and mute
  // the iframe whenever the stage footprint is no longer visible.
  useEffect(() => {
    if (!live) return;
    const syncVideoToView = () => {
      const f = iframeRef.current;
      if (!f) return;
      if (!anyStageInView(gameWorldOffRef.current)) {
        postCommand(f, 'mute');
      } else if (!siteMutedRef.current) {
        postCommand(f, 'unMute');
        postCommand(f, 'setVolume', [55]);
      }
    };
    const id = setInterval(syncVideoToView, 200);
    return () => clearInterval(id);
  }, [live, iframeRef]);

  return { video, src, vidKey, onIframeLoad, playerVisible };
}
