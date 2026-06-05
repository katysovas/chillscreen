'use client';

import { useState, useEffect, useMemo, useRef, useId } from 'react';
import { setConcertInView } from '@/lib/concertNow';
import { setConcertNowPlaying } from '@/lib/concertNowPlaying';

type ConcertVideo = { id: string; title: string };

const ROTATE_MS = 8 * 60 * 1000;

const FALLBACK: ConcertVideo[] = [
  { id: 'jfKfPfyJRdk', title: 'Lo-Fi Girl Radio' },
  { id: '5qap5aO4i9A', title: 'Lo-Fi Beats 24/7' },
  { id: 'MVPTGNGiI-4', title: 'Jazz Café' },
  { id: 'lTRiuFIWV54', title: 'Ocean Waves' },
  { id: 'DWcJFNfaw9c', title: 'Rain & Chill' },
  { id: 'q76bMs-NwRk', title: 'Coffee Shop Ambience' },
  { id: 'n61ULEU7CO0', title: 'Midnight Jazz' },
  { id: 'kgx4WGK0oNU', title: 'Piano in the Rain' },
  { id: '7NOSDKb0HlU', title: 'Classical Vibes' },
  { id: 'HuFYqnbVbzY', title: 'City Sounds' },
];

const S = `
  @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@300;400;700;900&family=Cormorant+Garamond:ital,wght@1,300&display=swap');

  @keyframes sw-a { 0%,100%{transform:rotate(-18deg)} 50%{transform:rotate(18deg)} }
  @keyframes sw-b { 0%,100%{transform:rotate(14deg)}  50%{transform:rotate(-14deg)} }
  @keyframes sw-c { 0%,100%{transform:rotate(-8deg)}  50%{transform:rotate(22deg)} }
  @keyframes sw-d { 0%,100%{transform:rotate(20deg)}  50%{transform:rotate(-10deg)} }
  @keyframes sw-e { 0%,100%{transform:rotate(-22deg)} 50%{transform:rotate(8deg)} }
  @keyframes sw-f { 0%,100%{transform:rotate(10deg)}  50%{transform:rotate(-20deg)} }
  @keyframes glow-a { 0%,100%{opacity:.28} 50%{opacity:.55} }
  @keyframes glow-b { 0%,100%{opacity:.55} 50%{opacity:.28} }
  @keyframes glow-c { 0%,100%{opacity:.20} 50%{opacity:.45} }
  @keyframes smoke {
    0%   { transform:translateX(0)   scaleX(1);   opacity:.22; }
    40%  { transform:translateX(18px) scaleX(1.3); opacity:.14; }
    100% { transform:translateX(-8px) scaleX(.9);  opacity:.22; }
  }
  @keyframes smoke2 {
    0%   { transform:translateX(0)   scaleX(1);   opacity:.18; }
    50%  { transform:translateX(-20px) scaleX(1.4); opacity:.10; }
    100% { transform:translateX(10px)  scaleX(.8);  opacity:.18; }
  }
  @keyframes crowd-sway { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-3px)} }
  @keyframes stg-mote { 0%{opacity:0;transform:translate(0,0)} 20%{opacity:.9} 100%{opacity:0;transform:translate(var(--mx),var(--my))} }

  .stg-wrap {
    display:flex; flex-direction:column; align-items:center;
    position:relative; z-index:1;
    filter: drop-shadow(0 0 50px rgba(56,216,128,.1)) drop-shadow(0 35px 70px rgba(0,0,0,.95));
  }
  .stg-ground-glow {
    position:absolute; bottom:-10px; width:720px; height:80px;
    background: radial-gradient(ellipse 80% 100% at 50% 100%, rgba(56,216,128,.18) 0%, transparent 70%);
    pointer-events:none;
  }
  .stg-mote {
    position:absolute; border-radius:50%;
    background:#38d880; box-shadow:0 0 6px 2px rgba(56,216,128,.7);
    pointer-events:none; animation:stg-mote linear infinite;
  }
`;

const LIGHTS = [
  { cx: 52,  color: '#38d880', anim: 'sw-a', dur: 4.2, del: 0   },
  { cx: 122, color: '#7844e8', anim: 'sw-b', dur: 3.8, del: 0.6 },
  { cx: 196, color: '#22d8f0', anim: 'sw-c', dur: 5.1, del: 1.2 },
  { cx: 324, color: '#f040a0', anim: 'sw-d', dur: 4.6, del: 0.4 },
  { cx: 398, color: '#22d8f0', anim: 'sw-e', dur: 3.5, del: 1.8 },
  { cx: 468, color: '#38d880', anim: 'sw-f', dur: 4.9, del: 0.9 },
];

function speakerCones(rows: number, cols: number) {
  const out: { r: number; c: number }[] = [];
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) out.push({ r, c });
  return out;
}

function makeCrowd(w: number) {
  const ppl = 13, pw = w / ppl;
  let d = 'M0,65 L0,54';
  for (let i = 0; i < ppl; i++) {
    const cx = (i + 0.5) * pw;
    const hy = 38 + (i % 4) * 4;
    const ay = 20 + (i % 5) * 4;
    const lx = cx - pw * 0.32;
    const rx = cx + pw * 0.32;
    d += ` Q${cx - pw * 0.25},${hy + 6} ${cx - pw * 0.08},${hy}`;
    d += ` L${lx},${ay}`;
    d += ` L${cx},${hy - 5}`;
    d += ` L${rx},${ay}`;
    d += ` Q${cx + pw * 0.08},${hy} ${cx + pw * 0.25},${hy + 6}`;
  }
  d += ` L${w},54 L${w},65 Z`;
  return d;
}

function pickRandomIndex(videos: ConcertVideo[], exclude?: number) {
  if (videos.length <= 1) return 0;
  let next: number;
  do { next = Math.floor(Math.random() * videos.length); }
  while (next === exclude);
  return next;
}

/** Native SVG design size before stage scale. */
const BASE_W = 520;
const BASE_H = 450;
/** Bigger stage + LED wall / YouTube frame. */
const STAGE_SCALE = 1.55;

export const CONCERT_WIDTH = Math.round(BASE_W * STAGE_SCALE);
export const CONCERT_HEIGHT = Math.round(BASE_H * STAGE_SCALE);
export const CONCERT_SCALE = 0.74;

function embedSrc(id: string, live: boolean) {
  const mute = live ? '0' : '1';
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=${mute}&rel=0&modestbranding=1&controls=0&iv_load_policy=3&loop=1&playlist=${id}`;
}

export default function Concert({ live = false }: { live?: boolean }) {
  const uid = useId().replace(/:/g, '');
  const [videos, setVideos] = useState<ConcertVideo[]>([]);
  const [idx, setIdx] = useState(0);
  const [vidKey, setVidKey] = useState(0);
  const videosRef = useRef(videos);
  videosRef.current = videos;

  useEffect(() => {
    setConcertInView(live);
    return () => {
      if (live) setConcertInView(false);
    };
  }, [live]);

  const pool = videos.length ? videos : FALLBACK;
  const video = pool[idx];

  useEffect(() => {
    if (live && video?.title) setConcertNowPlaying(video.title);
    else if (live) setConcertNowPlaying(null);
    return () => {
      if (live) setConcertNowPlaying(null);
    };
  }, [live, video?.title]);

  useEffect(() => {
    if (!live) return;
    let cancelled = false;

    fetch('/api/concert/videos')
      .then(r => r.json())
      .then((data: { videos?: ConcertVideo[] }) => {
        if (cancelled) return;
        const pool = data.videos?.length ? data.videos : FALLBACK;
        setVideos(pool);
        setIdx(Math.floor(Math.random() * pool.length));
        setVidKey(k => k + 1);
      })
      .catch(() => {
        if (!cancelled) {
          setVideos(FALLBACK);
          setIdx(Math.floor(Math.random() * FALLBACK.length));
          setVidKey(k => k + 1);
        }
      });

    return () => { cancelled = true; };
  }, [live]);

  useEffect(() => {
    if (!live || videos.length === 0) return;
    const id = setInterval(() => {
      const pool = videosRef.current;
      if (pool.length === 0) return;
      setIdx(prev => pickRandomIndex(pool, prev));
      setVidKey(k => k + 1);
    }, ROTATE_MS);
    return () => clearInterval(id);
  }, [live, videos.length]);

  const src = video ? embedSrc(video.id, live) : '';
  const crowdD = useMemo(() => makeCrowd(BASE_W), []);
  const spkCones = useMemo(() => speakerCones(6, 2), []);
  const marqueeTitle = video?.title ?? (live ? 'Loading…' : 'Live Concert');

  const motes = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    left: `${5 + (i * 79) % 90}%`,
    top: `${8 + (i * 53) % 84}%`,
    size: 1.5 + (i % 3),
    dur: 5 + (i * 1.1) % 7,
    del: (i * 0.7) % 5,
    mx: `${(i % 2 ? 1 : -1) * (5 + i % 12)}px`,
    my: `-${28 + (i % 4) * 12}px`,
  })), []);

  const gid = (name: string) => `${uid}-${name}`;

  return (
    <div className="stg-wrap" style={{ position: 'relative', width: CONCERT_WIDTH }}>
      <style>{S}</style>

      {motes.map((m, i) => (
        <div key={i} className="stg-mote" style={{
          left: m.left, top: m.top, width: m.size, height: m.size,
          ['--mx' as string]: m.mx,
          ['--my' as string]: m.my,
          animationDuration: `${m.dur}s`, animationDelay: `${m.del}s`,
        }} />
      ))}

      <svg
        viewBox={`0 0 ${CONCERT_WIDTH} ${CONCERT_HEIGHT}`}
        width={CONCERT_WIDTH}
        height={CONCERT_HEIGHT}
        style={{ display: 'block', overflow: 'visible' }}
      >
        <g transform={`scale(${STAGE_SCALE})`}>
        <defs>
          <filter id={gid('gb4')}><feGaussianBlur stdDeviation="4" /></filter>
          <filter id={gid('gb8')}><feGaussianBlur stdDeviation="8" /></filter>
          <filter id={gid('gb1')}><feGaussianBlur stdDeviation="1.5" /></filter>
          {LIGHTS.map((l, i) => (
            <linearGradient key={i} id={gid(`bg${i}`)} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={l.color} stopOpacity=".45" />
              <stop offset="100%" stopColor={l.color} stopOpacity="0" />
            </linearGradient>
          ))}
          {LIGHTS.map((l, i) => (
            <radialGradient key={i} id={gid(`sg${i}`)} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={l.color} stopOpacity=".5" />
              <stop offset="100%" stopColor={l.color} stopOpacity="0" />
            </radialGradient>
          ))}
          <radialGradient id={gid('scrGlow')} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(56,216,128,.25)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <linearGradient id={gid('smokeG')} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(56,216,128,.08)" />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>

        <path d="M0,62 L0,58 L260,4 L520,58 L520,62 Z" fill="#0c1810" />
        <path d="M0,58 L260,4 L520,58 Z" fill="#0e1c12" />
        <polyline points="0,58 260,4 520,58" stroke="rgba(56,216,128,.5)" strokeWidth="2" fill="none" />
        <line x1="260" y1="4" x2="260" y2="62" stroke="rgba(56,216,128,.25)" strokeWidth="1" strokeDasharray="4 4" />
        <polygon points="257,0 260,-8 263,0" fill="#38d880" opacity=".8" filter={`url(#${gid('gb1')})`} />
        <circle cx="260" cy="-4" r="3" fill="#38d880" opacity=".6" filter={`url(#${gid('gb4')})`} />

        <polygon points="0,58 0,310 25,310 25,62" fill="#0c1810" />
        <polygon points="520,58 520,310 495,310 495,62" fill="#0c1810" />

        <line x1="25" y1="68" x2="495" y2="68" stroke="#1e2e20" strokeWidth="6" strokeLinecap="round" />
        <line x1="25" y1="88" x2="495" y2="88" stroke="#1e2e20" strokeWidth="6" strokeLinecap="round" />
        {Array.from({ length: 25 }, (_, i) => (
          <line key={i}
            x1={25 + i * 19} y1={i % 2 === 0 ? 68 : 88}
            x2={25 + (i + 1) * 19} y2={i % 2 === 0 ? 88 : 68}
            stroke="#162418" strokeWidth="2" />
        ))}

        {LIGHTS.map((l, i) => (
          <g key={i}>
            <g transform={`translate(${l.cx},88)`}>
              <polygon
                points="-55,222 0,0 55,222"
                fill={`url(#${gid(`bg${i}`)})`}
                style={{
                  transformOrigin: '0 0',
                  animation: `${l.anim} ${l.dur}s ease-in-out infinite alternate`,
                  animationDelay: `${l.del}s`,
                }}
              />
            </g>
            <line x1={l.cx} y1={88} x2={l.cx} y2={104} stroke="#1a2818" strokeWidth="1.5" />
            <rect x={l.cx - 9} y={104} width={18} height={26} rx="5" fill="#162018" />
            <circle cx={l.cx} cy={120} r={7} fill={l.color} opacity={.75} filter={`url(#${gid('gb1')})`} />
            <circle cx={l.cx} cy={120} r={12} fill={l.color} opacity={.2} filter={`url(#${gid('gb4')})`} />
          </g>
        ))}

        <rect x="25" y="130" width="68" height="180" rx="4" fill="#0c1810" stroke="rgba(56,216,128,.2)" strokeWidth="1.5" />
        {spkCones.map(({ r, c }) => (
          <g key={`L${r}${c}`} transform={`translate(${39 + c * 26},${150 + r * 26})`}>
            <circle r="11" fill="#0a1410" stroke="#1a2a18" strokeWidth="1.5" />
            <circle r="7" fill="#0e1a10" stroke="#243a22" strokeWidth="1" />
            <circle r="3" fill="#122018" />
          </g>
        ))}

        <rect x="427" y="130" width="68" height="180" rx="4" fill="#0c1810" stroke="rgba(56,216,128,.2)" strokeWidth="1.5" />
        {spkCones.map(({ r, c }) => (
          <g key={`R${r}${c}`} transform={`translate(${441 + c * 26},${150 + r * 26})`}>
            <circle r="11" fill="#0a1410" stroke="#1a2a18" strokeWidth="1.5" />
            <circle r="7" fill="#0e1a10" stroke="#243a22" strokeWidth="1" />
            <circle r="3" fill="#122018" />
          </g>
        ))}

        <rect x="94" y="118" width="332" height="210" fill={`url(#${gid('scrGlow')})`} rx="2" filter={`url(#${gid('gb8')})`} />
        <rect x="99" y="122" width="322" height="200" rx="3" fill="#080e0a" stroke="rgba(56,216,128,.5)" strokeWidth="2" />
        <rect x="103" y="126" width="314" height="192" rx="2" fill="none" stroke="rgba(56,216,128,.15)" strokeWidth="1" />

        <foreignObject x="105" y="127" width="310" height="190">
          {live && video ? (
            <iframe
              key={vidKey}
              src={src}
              title={video.title}
              width="310"
              height="190"
              frameBorder="0"
              loading="lazy"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={{ display: 'block', border: 'none', background: '#000' }}
            />
          ) : (
            <div style={{ width: 310, height: 190, background: '#000' }} />
          )}
        </foreignObject>

        <path d="M25,310 L495,310 L510,370 L10,370 Z" fill="#0c1610" stroke="rgba(56,216,128,.15)" strokeWidth="1" />
        {LIGHTS.map((l, i) => (
          <ellipse key={i} cx={l.cx} cy={340} rx={38} ry={16} fill={`url(#${gid(`sg${i}`)})`}
            style={{ animation: `glow-${i % 3 === 0 ? 'a' : i % 3 === 1 ? 'b' : 'c'} ${2 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }} />
        ))}
        <line x1="10" y1="370" x2="510" y2="370" stroke="rgba(56,216,128,.3)" strokeWidth="2" />

        <ellipse cx="180" cy="318" rx="130" ry="22" fill={`url(#${gid('smokeG')})`} style={{ animation: 'smoke 6s ease-in-out infinite' }} />
        <ellipse cx="340" cy="320" rx="110" ry="18" fill={`url(#${gid('smokeG')})`} style={{ animation: 'smoke2 8s ease-in-out infinite' }} />

        <g transform="translate(0,385)" style={{ animation: 'crowd-sway 2.5s ease-in-out infinite' }}>
          <path d={crowdD} fill="#0a1a10" />
          <path d={crowdD} fill="rgba(56,216,128,.06)" />
        </g>
        <ellipse cx="260" cy="395" rx="240" ry="12" fill="rgba(56,216,128,.07)" filter={`url(#${gid('gb8')})`} />

        <rect x="160" y="92" width="200" height="30" rx="2" fill="#0a1610" stroke="rgba(56,216,128,.3)" strokeWidth="1" />
        <text x="260" y="111" textAnchor="middle"
          fontFamily="'Big Shoulders Display', sans-serif" fontWeight="300" fontSize="11" letterSpacing="4"
          fill="rgba(56,216,128,.75)" style={{ animation: 'glow-a 3s ease-in-out infinite' }}>
          {marqueeTitle.toUpperCase()}
        </text>
        </g>
      </svg>

      <div className="stg-ground-glow" />
    </div>
  );
}
