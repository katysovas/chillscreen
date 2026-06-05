'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import { setConcertInView } from '@/lib/concertNow';
import { getAudioMuted, subscribeAudioMuted } from '@/lib/audioMute';

export type StageVideo = { id: string; title: string };

const ROTATE_MS = 8 * 60 * 1000;

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

function pickRandomIndex(videos: StageVideo[], exclude?: number) {
  if (videos.length <= 1) return 0;
  let next: number;
  do { next = Math.floor(Math.random() * videos.length); }
  while (next === exclude);
  return next;
}

/** Oversize + crop styles so YouTube's chrome is pushed outside the window. */
export const STAGE_IFRAME_STYLE: React.CSSProperties = {
  position: 'absolute',
  top: '-12%',
  left: '-12%',
  width: '124%',
  height: '124%',
  border: 'none',
  pointerEvents: 'none',
};

type UseStagePlayerOptions = {
  live: boolean;
  apiPath: string;
  /** The player <iframe> (rendered declaratively by the caller). */
  iframeRef: RefObject<HTMLIFrameElement | null>;
  fallback: StageVideo[];
  /** Called with the current video title (or null) while this stage is live. */
  onNowPlaying?: (title: string | null) => void;
};

type UseStagePlayerResult = {
  video: StageVideo | undefined;
  /** iframe src — empty string when nothing should be mounted. */
  src: string;
  /** Forces a fresh iframe element on each video change. */
  vidKey: number;
  /** Wire to the iframe's onLoad — kicks playback + applies mute state. */
  onIframeLoad: () => void;
};

/**
 * Shared concert/festival YouTube logic. Renders a plain (declarative) iframe
 * — reliable inside SVG <foreignObject> — that autoplays muted so it never
 * sits black or shows the center play button, then unmutes via postMessage
 * once loaded (unless the site is muted). Fetches + rotates the playlist and
 * marks the stage "in view" so website audio and stage audio never overlap.
 */
export function useStagePlayer({
  live, apiPath, iframeRef, fallback, onNowPlaying,
}: UseStagePlayerOptions): UseStagePlayerResult {
  const [videos, setVideos] = useState<StageVideo[]>([]);
  const [idx, setIdx] = useState(0);
  const [vidKey, setVidKey] = useState(0);
  const videosRef = useRef(videos);
  videosRef.current = videos;

  const [siteMuted, setSiteMuted] = useState(false);
  const siteMutedRef = useRef(siteMuted);
  siteMutedRef.current = siteMuted;

  const pool = videos.length ? videos : fallback;
  const video = live ? pool[idx] : undefined;
  const src = video ? embedSrc(video.id) : '';

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

  // Fetch the playlist when the stage goes live.
  useEffect(() => {
    if (!live) return;
    let cancelled = false;

    fetch(apiPath)
      .then(r => r.json())
      .then((data: { videos?: StageVideo[] }) => {
        if (cancelled) return;
        const next = data.videos?.length ? data.videos : fallback;
        setVideos(next);
        setIdx(Math.floor(Math.random() * next.length));
        setVidKey(k => k + 1);
      })
      .catch(() => {
        if (!cancelled) {
          setVideos(fallback);
          setIdx(Math.floor(Math.random() * fallback.length));
          setVidKey(k => k + 1);
        }
      });

    return () => { cancelled = true; };
  // apiPath/fallback are stable per mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  // Rotate videos periodically.
  useEffect(() => {
    if (!live || videos.length === 0) return;
    const id = setInterval(() => {
      const next = videosRef.current;
      if (next.length === 0) return;
      setIdx(prev => pickRandomIndex(next, prev));
      setVidKey(k => k + 1);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [live, videos.length]);

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
