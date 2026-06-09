'use client';

import { useMemo, useRef, useId, type HTMLAttributes, type ReactNode } from 'react';
import { setConcertNowPlaying } from '@/lib/concertNowPlaying';
import { useStagePlayer, STAGE_IFRAME_STYLE } from './useStagePlayer';
import { DECORATIVE_SHAPE } from './city/shared/parallaxLayerStyle';
import type { StageChannel } from '@/lib/stageVideos';

const S = `
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

/** Native SVG design size before stage scale. */
const BASE_W = 520;
const BASE_H = 450;
/** Bigger stage + LED wall / YouTube frame. */
const STAGE_SCALE = 1.55;

export const CONCERT_WIDTH = Math.round(BASE_W * STAGE_SCALE);
export const CONCERT_HEIGHT = Math.round(BASE_H * STAGE_SCALE);
/** Display scale — between original (0.74) and the prior 2× boost (1.48). */
export const CONCERT_SCALE = 1.0;
/** Stage deck y inside the scaled SVG viewBox (BASE 370 × internal STAGE_SCALE). */
export const CONCERT_DECK_VIEWBOX_Y = Math.round(370 * STAGE_SCALE);

const crowdD = makeCrowd(BASE_W);
const spkCones = speakerCones(6, 2);

type ConcertChromeProps = {
  label?: string;
  channel: StageChannel;
  marqueeTitle: string;
  screen: ReactNode;
  showMotes?: boolean;
};

/** Shared truss + crowd SVG — no YouTube hooks. */
function ConcertChrome({
  label,
  channel,
  marqueeTitle,
  screen,
  showMotes = false,
}: ConcertChromeProps) {
  const uid = useId().replace(/:/g, '');
  const isSeattle = channel === 'bumbershoot';
  const gid = (name: string) => `${uid}-${name}`;

  const motes = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    left: `${5 + (i * 79) % 90}%`,
    top: `${8 + (i * 53) % 84}%`,
    size: 1.5 + (i % 3),
    dur: 5 + (i * 1.1) % 7,
    del: (i * 0.7) % 5,
    mx: `${(i % 2 ? 1 : -1) * (5 + i % 12)}px`,
    my: `-${28 + (i % 4) * 12}px`,
  })), []);

  return (
    <div className="stg-wrap" style={{ position: 'relative', width: CONCERT_WIDTH }}>
      <style>{S}</style>

      {showMotes && motes.map((m, i) => (
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

        {label && !isSeattle && (
          <g>
            <line x1={150} y1={-6} x2={166} y2={14} stroke="#16241a" strokeWidth="3" />
            <line x1={370} y1={-6} x2={354} y2={14} stroke="#16241a" strokeWidth="3" />
            <rect x={84} y={-46} width={352} height={38} rx={5}
              fill="#0a1610" stroke="rgba(56,216,128,.55)" strokeWidth="1.5" />
            <rect x={84} y={-46} width={352} height={38} rx={5}
              fill={`url(#${gid('scrGlow')})`} opacity={0.6} />
            <text x={260} y={-20} textAnchor="middle"
              fontFamily="system-ui, sans-serif" fontWeight="900"
              fontSize="20" letterSpacing="5" fill="#62f2a6"
              style={{ animation: 'glow-b 3.2s ease-in-out infinite' }}>
              {label.toUpperCase()}
            </text>
          </g>
        )}

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
          <div style={{ width: 310, height: 190, background: '#000', position: 'relative' }}>
            {screen}
          </div>
        </foreignObject>

        <path d="M25,310 L495,310 L510,370 L10,370 Z" fill="#0c1610" stroke="rgba(56,216,128,.15)" strokeWidth="1" />
        {LIGHTS.map((l, i) => (
          <ellipse key={i} cx={l.cx} cy={340} rx={38} ry={16} fill={`url(#${gid(`sg${i}`)})`}
            style={{ animation: `glow-${i % 3 === 0 ? 'a' : i % 3 === 1 ? 'b' : 'c'} ${2 + i * 0.3}s ease-in-out infinite`, animationDelay: `${i * 0.4}s` }} />
        ))}
        <line x1="10" y1="370" x2="510" y2="370" stroke="rgba(56,216,128,.3)" strokeWidth="2" />

        <ellipse cx="180" cy="318" rx="130" ry="22" fill={`url(#${gid('smokeG')})`} style={{ animation: 'smoke 6s ease-in-out infinite' }} />
        <ellipse cx="340" cy="320" rx="110" ry="18" fill={`url(#${gid('smokeG')})`} style={{ animation: 'smoke2 8s ease-in-out infinite' }} />

        <g
          transform="translate(0,385)"
          style={{ animation: 'crowd-sway 2.5s ease-in-out infinite' }}
          {...DECORATIVE_SHAPE}
        >
          <path d={crowdD} fill="#0a1a10" />
          <path d={crowdD} fill="rgba(56,216,128,.06)" />
        </g>
        <ellipse cx="260" cy="395" rx="240" ry="12" fill="rgba(56,216,128,.07)" filter={`url(#${gid('gb8')})`} />

        <rect x="100" y="90" width="320" height="34" rx="2" fill="#0a1610" stroke="rgba(56,216,128,.3)" strokeWidth="1" />
        <foreignObject x="100" y="90" width="320" height="34">
          <div
            {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as HTMLAttributes<HTMLDivElement>)}
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 12px',
              boxSizing: 'border-box',
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 600,
              fontSize: 10,
              letterSpacing: 1.5,
              lineHeight: 1.2,
              color: 'rgba(56,216,128,.75)',
              textAlign: 'center',
              wordBreak: 'break-word',
              overflow: 'hidden',
            }}
          >
            {marqueeTitle.toUpperCase()}
          </div>
        </foreignObject>
        </g>
      </svg>

      <div className="stg-ground-glow" />
    </div>
  );
}

type ConcertShellProps = {
  label?: string;
  channel?: StageChannel;
};

/** Static concert stage — no YouTube player or hooks. */
export function ConcertShell({
  label,
  channel = 'outside-lands' as StageChannel,
}: ConcertShellProps) {
  const isSeattle = channel === 'bumbershoot';
  const venueLabel = label ?? 'Seattle';
  const marqueeTitle = isSeattle ? venueLabel : (label ?? 'Live Concert');

  return (
    <ConcertChrome
      label={label}
      channel={channel}
      marqueeTitle={marqueeTitle}
      showMotes={false}
      screen={<div style={{ width: '100%', height: '100%', background: '#080e0a' }} />}
    />
  );
}

function ConcertLive({
  label,
  channel = 'outside-lands' as StageChannel,
}: {
  label?: string;
  channel?: StageChannel;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { video, src, vidKey, onIframeLoad, playerVisible } = useStagePlayer({
    live: true,
    channel,
    iframeRef,
    onNowPlaying: setConcertNowPlaying,
  });

  const isSeattle = channel === 'bumbershoot';
  const venueLabel = label ?? 'Seattle';
  const marqueeTitle = isSeattle
    ? venueLabel
    : (video?.title ?? 'Loading…');

  const screen = (
    <>
      {src && (
        <iframe
          key={vidKey}
          ref={iframeRef}
          data-stage-embed
          src={src}
          title={video?.title ?? 'Live'}
          loading="eager"
          onLoad={onIframeLoad}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
          style={STAGE_IFRAME_STYLE}
        />
      )}
      {src && (
        <div data-stage-video-veil style={{
          position: 'absolute', inset: 0, zIndex: 10,
          background: 'rgba(0,0,0,0.93)', pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5,
          opacity: playerVisible ? 0 : 1,
          transition: playerVisible ? 'opacity 0.8s' : 'none',
        }}>
          <span style={{ fontFamily: 'sans-serif', fontSize: 9, letterSpacing: 2, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>▶ now playing</span>
          {(isSeattle ? venueLabel : video?.title) && (
            <span style={{ fontFamily: 'sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.8)', textAlign: 'center', padding: '0 10px', lineHeight: 1.3 }}>
              {isSeattle ? venueLabel : video?.title}
            </span>
          )}
        </div>
      )}
    </>
  );

  return (
    <ConcertChrome
      label={label}
      channel={channel}
      marqueeTitle={marqueeTitle}
      showMotes={false}
      screen={screen}
    />
  );
}

export default function Concert({
  live = false,
  label,
  channel = 'outside-lands' as StageChannel,
}: {
  live?: boolean;
  label?: string;
  channel?: StageChannel;
}) {
  if (!live) return <ConcertShell label={label} channel={channel} />;
  return <ConcertLive label={label} channel={channel} />;
}
