'use client';

import { useRef } from 'react';
import type { HTMLAttributes, ReactElement } from 'react';
import {
  COACHELLA_STAGE_PUSH_Y,
  COACHELLA_STAGE_SCALE,
  COACHELLA_STAGE_MID_X,
  FEST_COLORS,
  SD_GND,
} from './constants';
import { setCoachellaNowPlaying } from '@/lib/coachellaNowPlaying';
import { useStagePlayer, STAGE_IFRAME_STYLE } from '../../useStagePlayer';

/** Stage center x — used for venue focus / in-view checks. */
export { COACHELLA_STAGE_MID_X };

const STAGE_L = 2010;
const STAGE_R = 2440;
const STAGE_TOP = 404;

const FOOTLIGHTS = Array.from({ length: 13 }, (_, i) => ({
  x: STAGE_L + 26 + i * ((STAGE_R - STAGE_L - 32) / 12),
  color: FEST_COLORS[i % FEST_COLORS.length]!,
  dur: 1.4 + (i % 5) * 0.35,
  del: (i % 7) * 0.18,
}));

/** Truss-mounted festival lights — small bulbs with a soft cone wash.
 *  Rendered after the video in live mode so the cones glow over the screen. */
function TrussLights() {
  const top = STAGE_TOP;
  return (
    <>
      {FOOTLIGHTS.map((f, i) => (
        <g key={`foot${i}`}>
          <rect x={f.x - 4} y={top + 4} width={8} height={8} rx={2} fill="#101016" />
          <polygon
            points={`${f.x - 3},${top + 12} ${f.x + 3},${top + 12} ${f.x + 12},${top + 52} ${f.x - 12},${top + 52}`}
            fill={f.color}
            opacity={0.22}
            style={{
              animation: `sdc-shine ${f.dur}s ease-in-out infinite`,
              animationDelay: `${f.del}s`,
              mixBlendMode: 'screen',
            }}
          />
          <polygon
            points={`${f.x - 3},${top + 12} ${f.x + 3},${top + 12} ${f.x + 12},${top + 52} ${f.x - 12},${top + 52}`}
            fill="url(#sdc-beamgrad)"
            opacity={0.35}
            style={{ mixBlendMode: 'screen' }}
          />
          <circle cx={f.x} cy={top + 12} r={6} fill={f.color} opacity={0.5}
            filter="url(#sdc-blur)"
            style={{ animation: `sdc-shine ${f.dur}s ease-in-out infinite`, animationDelay: `${f.del}s` }} />
          <circle cx={f.x} cy={top + 12} r={2.5} fill="#fff" opacity={0.9} />
          <circle cx={f.x} cy={top + 12} r={3.5} fill={f.color}
            style={{ animation: `sdc-shine ${f.dur}s ease-in-out infinite`, animationDelay: `${f.del}s` }} />
        </g>
      ))}
    </>
  );
}

type FestivalStageShellProps = {
  /** Dark LED fill + scanlines when no video is mounted. */
  idleScreen?: boolean;
  /** Live mode renders the lights separately, above the video. */
  hideLights?: boolean;
};

/** Static truss portal + LED frame — no YouTube hooks. */
function FestivalStageShell({
  idleScreen = true,
  hideLights = false,
}: FestivalStageShellProps) {
  const L = STAGE_L;
  const R = STAGE_R;
  const top = STAGE_TOP;
  const deck = SD_GND;
  // Trusses occupy [L, L+20] and [R, R+20] — interior is [L+20, R], so +54 centers the screen.
  const screenX = L + 54;
  const screenY = 420;
  const screenW = R - L - 88;
  const screenH = 168;
  const ox = COACHELLA_STAGE_MID_X;
  const oy = deck;
  const midX = (L + R) / 2;
  const pushY = COACHELLA_STAGE_PUSH_Y;

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

  const beams = [
    { x: L + 34,  color: '#7a3ad0', anim: 'sdc-beam-a', dur: 4.3 },
    { x: L + 150, color: '#e8506a', anim: 'sdc-beam-b', dur: 3.7 },
    { x: R - 150, color: '#22c7e0', anim: 'sdc-beam-c', dur: 4.9 },
    { x: R - 34,  color: '#f0a840', anim: 'sdc-beam-d', dur: 4.1 },
  ];

  return (
    <>
      <g transform={`translate(0, ${pushY})`}>
        <g transform={`translate(${ox},${oy}) scale(${COACHELLA_STAGE_SCALE}) translate(${-ox},${-oy})`}>
          <defs>
            <linearGradient id="sdc-roof" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#33333d" />
              <stop offset="100%" stopColor="#1d1d25" />
            </linearGradient>
            <linearGradient id="sdc-led" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#7a3ad0">
                <animate attributeName="stop-color"
                  values="#7a3ad0;#e8506a;#f0a840;#22c7e0;#7a3ad0" dur="12s" repeatCount="indefinite" />
              </stop>
              <stop offset="100%" stopColor="#22c7e0">
                <animate attributeName="stop-color"
                  values="#22c7e0;#7a3ad0;#e8506a;#f0a840;#22c7e0" dur="12s" repeatCount="indefinite" />
              </stop>
            </linearGradient>
            <linearGradient id="sdc-beamgrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
            <radialGradient id="sdc-foot" cx="50%" cy="100%" r="80%">
              <stop offset="0%" stopColor="#fff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </radialGradient>
            <filter id="sdc-blur" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" />
            </filter>
          </defs>

          {beams.map((b, i) => (
            <g key={`beam${i}`} transform={`translate(${b.x},${top + 12})`}>
              <polygon
                points="-30,210 0,0 30,210"
                fill="url(#sdc-beamgrad)"
                opacity={0.5}
                style={{
                  transformOrigin: '0px 0px',
                  animation: `${b.anim} ${b.dur}s ease-in-out infinite`,
                  mixBlendMode: 'screen',
                }}
              />
              <polygon
                points="-16,210 0,0 16,210"
                fill={b.color}
                opacity={0.32}
                style={{
                  transformOrigin: '0px 0px',
                  animation: `${b.anim} ${b.dur}s ease-in-out infinite`,
                  mixBlendMode: 'screen',
                }}
              />
            </g>
          ))}

          <path
            d={`M${L - 26},${top} L${R + 26},${top} L${R - 6},${top - 40} L${L + 6},${top - 40} Z`}
            fill="url(#sdc-roof)"
          />
          <path
            d={`M${L - 26},${top} L${R + 26},${top} L${R + 26},${top + 6} L${L - 26},${top + 6} Z`}
            fill="#141019"
          />

          <rect x={L} y={top} width={20} height={deck - top} fill="#2c2c34" />
          <rect x={R} y={top} width={20} height={deck - top} fill="#2c2c34" />
          <rect x={L} y={top} width={R - L + 20} height={20} fill="#2c2c34" />
          {lattice(L, top + 20, 20, deck - top - 20)}
          {lattice(R, top + 20, 20, deck - top - 20)}

          {beams.map((b, i) => (
            <g key={`fix${i}`}>
              <rect x={b.x - 7} y={top + 4} width={14} height={12} rx={3} fill="#101016" />
              <circle cx={b.x} cy={top + 14} r={5} fill={b.color}
                style={{ animation: 'sdc-shine 2.6s ease-in-out infinite' }} />
              <circle cx={b.x} cy={top + 14} r={10} fill={b.color} opacity={0.4}
                filter="url(#sdc-blur)" style={{ animation: 'sdc-shine 2.6s ease-in-out infinite' }} />
            </g>
          ))}

          <rect
            x={screenX - 8} y={screenY - 8} width={screenW + 16} height={screenH + 16}
            rx={4} fill="#1a1a22" stroke="#e85074" strokeWidth={3}
          />
          <rect
            x={screenX} y={screenY} width={screenW} height={screenH} rx={3}
            fill="#0b0b12" stroke="#2c2c34" strokeWidth={2.5}
          />
          {idleScreen && (
            <>
              <rect
                x={screenX + 6} y={screenY + 6} width={screenW - 12} height={screenH - 12}
                rx={2} fill="#0b0b12"
              />
              {Array.from({ length: 6 }, (_, i) => (
                <rect key={i} x={screenX + 6} y={screenY + 14 + i * 26} width={screenW - 12} height={3}
                  fill="rgba(255,255,255,.12)" pointerEvents="none" />
              ))}
            </>
          )}

          {[L + 30, R - 14].map((sx, i) => (
            <g key={i}>
              {Array.from({ length: 6 }, (_, j) => (
                <polygon key={j}
                  points={`${sx},${top + 26 + j * 17} ${sx + 22},${top + 28 + j * 17} ${sx + 22},${top + 40 + j * 17} ${sx},${top + 42 + j * 17}`}
                  fill="#1c1c24" stroke="#34343c" strokeWidth={0.8} />
              ))}
            </g>
          ))}

          <rect x={L - 26} y={deck - 6} width={R - L + 72} height={12} fill="#1a1a22" />
          <ellipse cx={midX} cy={deck - 6} rx={(R - L) / 2} ry={22} fill="rgba(240,168,64,.18)"
            style={{ animation: 'sdc-glow 5s ease-in-out infinite' }} />

          {!hideLights && <TrussLights />}
        </g>
      </g>
    </>
  );
}

/** Live Coachella — shell + synchronized YouTube player. */
function FestivalStageLive() {
  const L = 2010;
  const R = 2440;
  const top = 404;
  const deck = SD_GND;
  // Must match FestivalStageShell — screen centered in the truss interior.
  const screenX = L + 54;
  const screenY = 420;
  const screenW = R - L - 88;
  const screenH = 168;
  const iframeX = screenX + 6;
  const iframeY = screenY + 6;
  const iframeW = screenW - 12;
  const iframeH = screenH - 12;
  const ox = COACHELLA_STAGE_MID_X;
  const oy = deck;
  const S = COACHELLA_STAGE_SCALE;
  const pushY = COACHELLA_STAGE_PUSH_Y;

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { video, src, vidKey, onIframeLoad, playerVisible } = useStagePlayer({
    live: true,
    channel: 'coachella',
    iframeRef,
    onNowPlaying: setCoachellaNowPlaying,
  });

  const videoFoX = ox + S * (iframeX - ox);
  const videoFoY = oy + S * (iframeY - oy) + pushY;
  const videoFoW = iframeW * S;
  const videoFoH = iframeH * S;

  return (
    <>
      <FestivalStageShell idleScreen={false} hideLights />
      <foreignObject x={videoFoX} y={videoFoY} width={videoFoW} height={videoFoH} style={{ overflow: 'visible' }}>
        <div
          {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as HTMLAttributes<HTMLDivElement>)}
          style={{
            width: iframeW,
            transform: `scale(${S})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }}
        >
          <div style={{ width: iframeW, height: iframeH, background: '#000', position: 'relative' }}>
            {src && (
              <iframe
                key={vidKey}
                ref={iframeRef}
                src={src}
                title={video?.title ?? 'The Desert'}
                loading="lazy"
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
                {video?.title && <span style={{ fontFamily: 'sans-serif', fontSize: 11, color: 'rgba(255,255,255,0.8)', textAlign: 'center', padding: '0 10px', lineHeight: 1.3 }}>{video.title}</span>}
              </div>
            )}
          </div>
        </div>
      </foreignObject>
      {/* Lights re-rendered above the video so the cones glow over the screen. */}
      <g transform={`translate(0, ${pushY})`} pointerEvents="none">
        <g transform={`translate(${ox},${oy}) scale(${S}) translate(${-ox},${-oy})`}>
          <TrussLights />
        </g>
      </g>
    </>
  );
}

/** Coachella main stage — truss portal, LED wall with YouTube when live. */
export function FestivalStage({ live = false }: { live?: boolean }) {
  if (!live) return <FestivalStageShell />;
  return <FestivalStageLive />;
}
