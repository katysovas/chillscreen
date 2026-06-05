'use client';

import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { SD_GND, FEST_COLORS, COACHELLA_STAGE_MID_X, COACHELLA_STAGE_SCALE } from './constants';
import { setCoachellaNowPlaying } from '@/lib/coachellaNowPlaying';

type CoachellaVideo = { id: string; title: string };

const ROTATE_MS = 8 * 60 * 1000;

const FALLBACK: CoachellaVideo[] = [
  { id: 'jfKfPfyJRdk', title: 'Lo-Fi Girl Radio' },
  { id: '5qap5aO4i9A', title: 'Lo-Fi Beats 24/7' },
  { id: 'MVPTGNGiI-4', title: 'Jazz Café' },
  { id: 'lTRiuFIWV54', title: 'Ocean Waves' },
  { id: 'DWcJFNfaw9c', title: 'Rain & Chill' },
];

function pickRandomIndex(videos: CoachellaVideo[], exclude?: number) {
  if (videos.length <= 1) return 0;
  let next: number;
  do {
    next = Math.floor(Math.random() * videos.length);
  } while (next === exclude);
  return next;
}

function embedSrc(id: string, live: boolean) {
  const mute = live ? '0' : '1';
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=${mute}&rel=0&modestbranding=1&controls=0&iv_load_policy=3&loop=1&playlist=${id}`;
}

/** Stage center x — used for venue focus / in-view checks. */
export { COACHELLA_STAGE_MID_X };

/** Coachella main stage — truss portal, LED wall with YouTube when live. */
export function FestivalStage({ live = false }: { live?: boolean }) {
  const L = 2010;
  const R = 2440;
  const top = 404;
  const deck = SD_GND;
  const screenX = L + 44;
  const screenY = 446;
  const screenW = R - L - 88;
  const screenH = 168;
  const iframeX = screenX + 6;
  const iframeY = screenY + 6;
  const iframeW = screenW - 12;
  const iframeH = screenH - 12;

  const [videos, setVideos] = useState<CoachellaVideo[]>([]);
  const [idx, setIdx] = useState(0);
  const [vidKey, setVidKey] = useState(0);
  const videosRef = useRef(videos);
  videosRef.current = videos;

  const pool = videos.length ? videos : FALLBACK;
  const video = pool[idx];

  useEffect(() => {
    if (live && video?.title) setCoachellaNowPlaying(video.title);
    else if (live) setCoachellaNowPlaying(null);
    return () => {
      if (live) setCoachellaNowPlaying(null);
    };
  }, [live, video?.title]);

  useEffect(() => {
    if (!live) return;
    let cancelled = false;

    fetch('/api/coachella/videos')
      .then(r => r.json())
      .then((data: { videos?: CoachellaVideo[] }) => {
        if (cancelled) return;
        const next = data.videos?.length ? data.videos : FALLBACK;
        setVideos(next);
        setIdx(Math.floor(Math.random() * next.length));
        setVidKey(k => k + 1);
      })
      .catch(() => {
        if (!cancelled) {
          setVideos(FALLBACK);
          setIdx(Math.floor(Math.random() * FALLBACK.length));
          setVidKey(k => k + 1);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [live]);

  useEffect(() => {
    if (!live || videos.length === 0) return;
    const id = setInterval(() => {
      const nextPool = videosRef.current;
      if (nextPool.length === 0) return;
      setIdx(prev => pickRandomIndex(nextPool, prev));
      setVidKey(k => k + 1);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [live, videos.length]);

  const src = video ? embedSrc(video.id, live) : '';

  const lattice = (x: number, y: number, w: number, h: number) => {
    const lines: ReactElement[] = [];
    const step = 22;
    for (let yy = y; yy < y + h; yy += step) {
      lines.push(
        <line key={`a${yy}`} x1={x} y1={yy} x2={x + w} y2={yy + step} stroke="#3a3a44" strokeWidth={1.4} />,
      );
      lines.push(
        <line key={`b${yy}`} x1={x + w} y1={yy} x2={x} y2={yy + step} stroke="#3a3a44" strokeWidth={1.4} />,
      );
    }
    return lines;
  };

  const ox = COACHELLA_STAGE_MID_X;
  const oy = deck;
  const midX = (L + R) / 2;

  return (
    <g transform={`translate(${ox},${oy}) scale(${COACHELLA_STAGE_SCALE}) translate(${-ox},${-oy})`}>
      {/* Header sign above the roof */}
      <defs>
        <style>{`@import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700&display=swap');`}</style>
      </defs>
      <rect
        x={midX - 118}
        y={top - 62}
        width={236}
        height={30}
        rx={3}
        fill="#1a1a22"
        stroke="#e85074"
        strokeWidth={1.5}
      />
      <text
        x={midX}
        y={top - 41}
        textAnchor="middle"
        fontFamily="'Big Shoulders Display', sans-serif"
        fontWeight="700"
        fontSize="13"
        letterSpacing="6"
        fill="#e85074"
      >
        COUCHELLA
      </text>
      <path
        d={`M${L - 26},${top} L${R + 26},${top} L${R - 6},${top - 40} L${L + 6},${top - 40} Z`}
        fill="#26262e"
      />
      <path
        d={`M${L - 26},${top} L${R + 26},${top} L${R + 26},${top + 6} L${L - 26},${top + 6} Z`}
        fill="#1a1a22"
      />

      <rect x={L} y={top} width={20} height={deck - top} fill="#2c2c34" />
      <rect x={R} y={top} width={20} height={deck - top} fill="#2c2c34" />
      <rect x={L} y={top} width={R - L + 20} height={20} fill="#2c2c34" />
      {lattice(L, top + 20, 20, deck - top - 20)}
      {lattice(R, top + 20, 20, deck - top - 20)}

      <defs>
        <linearGradient id="sdc-led" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#7a3ad0" />
          <stop offset="50%" stopColor="#e8506a" />
          <stop offset="100%" stopColor="#f0a840" />
        </linearGradient>
      </defs>
      <rect x={screenX} y={screenY} width={screenW} height={screenH} fill="#101018" />
      <rect
        x={screenX + 6}
        y={screenY + 6}
        width={screenW - 12}
        height={screenH - 12}
        fill="url(#sdc-led)"
        opacity={live ? 0.15 : 0.5}
      />

      <foreignObject
        x={iframeX}
        y={iframeY}
        width={iframeW}
        height={iframeH}
        style={{ pointerEvents: live ? 'auto' : 'none' }}
      >
        {live && video ? (
          <iframe
            key={vidKey}
            src={src}
            title={video.title}
            width={iframeW}
            height={iframeH}
            frameBorder="0"
            loading="lazy"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            style={{ display: 'block', border: 'none', background: '#000' }}
          />
        ) : (
          <div style={{ width: iframeW, height: iframeH, background: '#000' }} />
        )}
      </foreignObject>

      {Array.from({ length: 6 }, (_, i) => (
        <rect
          key={i}
          x={screenX + 6}
          y={screenY + 14 + i * 26}
          width={screenW - 12}
          height={3}
          fill="rgba(255,255,255,.12)"
          pointerEvents="none"
        />
      ))}

      {[L + 30, R - 14].map((sx, i) => (
        <g key={i}>
          {Array.from({ length: 6 }, (_, j) => (
            <polygon
              key={j}
              points={`${sx},${top + 26 + j * 17} ${sx + 22},${top + 28 + j * 17} ${sx + 22},${top + 40 + j * 17} ${sx},${top + 42 + j * 17}`}
              fill="#1c1c24"
              stroke="#34343c"
              strokeWidth={0.8}
            />
          ))}
        </g>
      ))}

      {Array.from({ length: 11 }, (_, i) => {
        const lx = L + 36 + i * ((R - L - 52) / 10);
        const c = FEST_COLORS[i % FEST_COLORS.length];
        return (
          <g key={i}>
            <rect x={lx - 4} y={top + 20} width={8} height={9} rx={1} fill="#222" />
            <ellipse cx={lx} cy={top + 40} rx={9} ry={26} fill={c} opacity={0.16} />
            <circle cx={lx} cy={top + 30} r={2.4} fill={c} />
          </g>
        );
      })}

      <rect x={L - 26} y={deck - 6} width={R - L + 72} height={12} fill="#1a1a22" />
      <ellipse cx={(L + R) / 2} cy={deck - 6} rx={(R - L) / 2} ry={20} fill="rgba(240,168,64,.16)" />

      <g fill="#23202a">
        <path
          d={`M${L - 120},${deck + 22}
          ${Array.from({ length: 40 }, (_, i) => `Q${L - 120 + i * 16 + 8},${deck + 6 + (i % 3) * 5} ${L - 120 + (i + 1) * 16},${deck + 18}`).join(' ')}
          L${R + 130},${deck + 60} L${L - 120},${deck + 60} Z`}
        />
        {Array.from({ length: 26 }, (_, i) => (
          <circle key={i} cx={L - 110 + i * 24} cy={deck + 14 + (i % 4) * 3} r={4.5} />
        ))}
      </g>
    </g>
  );
}
