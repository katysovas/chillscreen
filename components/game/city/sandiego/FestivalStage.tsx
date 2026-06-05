'use client';

import { useRef } from 'react';
import type { HTMLAttributes, ReactElement } from 'react';
import { SD_GND, FEST_COLORS, COACHELLA_STAGE_MID_X, COACHELLA_STAGE_SCALE } from './constants';
import { setCoachellaNowPlaying } from '@/lib/coachellaNowPlaying';
import { useStagePlayer, STAGE_IFRAME_STYLE } from '../../useStagePlayer';

const STAGE_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;900&display=swap');
  @keyframes sdc-beam-a { 0%,100%{transform:rotate(-16deg)} 50%{transform:rotate(14deg)} }
  @keyframes sdc-beam-b { 0%,100%{transform:rotate(12deg)}  50%{transform:rotate(-18deg)} }
  @keyframes sdc-beam-c { 0%,100%{transform:rotate(-10deg)} 50%{transform:rotate(20deg)} }
  @keyframes sdc-beam-d { 0%,100%{transform:rotate(18deg)}  50%{transform:rotate(-12deg)} }
  @keyframes sdc-shine  { 0%,100%{opacity:.35} 50%{opacity:1} }
  @keyframes sdc-glow   { 0%,100%{opacity:.5} 50%{opacity:.95} }
  @keyframes sdc-marquee{ 0%,100%{opacity:.7} 50%{opacity:1} }
`;

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

  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { video, src, vidKey, onIframeLoad, playerVisible } = useStagePlayer({
    live,
    channel: 'coachella',
    iframeRef,
    onNowPlaying: setCoachellaNowPlaying,
  });

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
  const marquee = video?.title ?? (live ? 'LOADING…' : 'COUCHELLA');

  // Spotlights mounted along the truss header — each sweeps a colored beam.
  const beams = [
    { x: L + 34,  color: '#7a3ad0', anim: 'sdc-beam-a', dur: 4.3 },
    { x: L + 150, color: '#e8506a', anim: 'sdc-beam-b', dur: 3.7 },
    { x: R - 150, color: '#22c7e0', anim: 'sdc-beam-c', dur: 4.9 },
    { x: R - 34,  color: '#f0a840', anim: 'sdc-beam-d', dur: 4.1 },
  ];

  // Footlights along the front of the deck — pulse/shine.
  const footlights = Array.from({ length: 13 }, (_, i) => ({
    x: L + 26 + i * ((R - L - 32) / 12),
    color: FEST_COLORS[i % FEST_COLORS.length],
    dur: 1.4 + (i % 5) * 0.35,
    del: (i % 7) * 0.18,
  }));

  // Video rect in the SVG-scaled stage coords, projected into the UNSCALED tile
  // space so the player can render via the same foreignObject + XHTML-div +
  // CSS-scale pattern used by Concert / Cinema (the only reliable embed path).
  const S = COACHELLA_STAGE_SCALE;
  const videoFoX = ox + S * (iframeX - ox);
  const videoFoY = oy + S * (iframeY - oy);
  const videoFoW = iframeW * S;
  const videoFoH = iframeH * S;

  return (
    <>
    <g transform={`translate(${ox},${oy}) scale(${COACHELLA_STAGE_SCALE}) translate(${-ox},${-oy})`}>
      <defs>
        <style>{STAGE_CSS}</style>
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
        <filter id="sdc-blur6" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
      </defs>

      {/* ── Animated spotlight beams (behind the screen, in front of truss) ── */}
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

      {/* Header sign above the roof */}
      <rect
        x={midX - 130} y={top - 64} width={260} height={32} rx={4}
        fill="#15151c" stroke="#e85074" strokeWidth={1.5}
        style={{ animation: 'sdc-glow 3.4s ease-in-out infinite' }}
      />
      <text
        x={midX} y={top - 41} textAnchor="middle"
        fontFamily="'Big Shoulders Display', sans-serif" fontWeight="900"
        fontSize="16" letterSpacing="7" fill="#ff7a98"
        style={{ animation: 'sdc-shine 3s ease-in-out infinite' }}
      >
        COUCHELLA
      </text>

      {/* Roof / canopy */}
      <path
        d={`M${L - 26},${top} L${R + 26},${top} L${R - 6},${top - 40} L${L + 6},${top - 40} Z`}
        fill="url(#sdc-roof)"
      />
      <path
        d={`M${L - 26},${top} L${R + 26},${top} L${R + 26},${top + 6} L${L - 26},${top + 6} Z`}
        fill="#141019"
      />

      {/* Truss towers */}
      <rect x={L} y={top} width={20} height={deck - top} fill="#2c2c34" />
      <rect x={R} y={top} width={20} height={deck - top} fill="#2c2c34" />
      <rect x={L} y={top} width={R - L + 20} height={20} fill="#2c2c34" />
      {lattice(L, top + 20, 20, deck - top - 20)}
      {lattice(R, top + 20, 20, deck - top - 20)}

      {/* Spotlight fixtures on the header */}
      {beams.map((b, i) => (
        <g key={`fix${i}`}>
          <rect x={b.x - 7} y={top + 4} width={14} height={12} rx={3} fill="#101016" />
          <circle cx={b.x} cy={top + 14} r={5} fill={b.color}
            style={{ animation: 'sdc-shine 2.6s ease-in-out infinite' }} />
          <circle cx={b.x} cy={top + 14} r={10} fill={b.color} opacity={0.4}
            filter="url(#sdc-blur)" style={{ animation: 'sdc-shine 2.6s ease-in-out infinite' }} />
        </g>
      ))}

      {/* LED wall + glowing frame */}
      <rect x={screenX - 6} y={screenY - 6} width={screenW + 12} height={screenH + 12}
        rx={4} fill="url(#sdc-led)" opacity={0.55} filter="url(#sdc-blur6)"
        style={{ animation: 'sdc-glow 4s ease-in-out infinite' }} />
      <rect x={screenX} y={screenY} width={screenW} height={screenH} rx={3} fill="#0b0b12"
        stroke="url(#sdc-led)" strokeWidth={2.5} />
      <rect
        x={screenX + 6} y={screenY + 6} width={screenW - 12} height={screenH - 12}
        fill="url(#sdc-led)" opacity={live ? 0.12 : 0.5}
      />

      {/* Scanlines */}
      {!live && Array.from({ length: 6 }, (_, i) => (
        <rect key={i} x={screenX + 6} y={screenY + 14 + i * 26} width={screenW - 12} height={3}
          fill="rgba(255,255,255,.12)" pointerEvents="none" />
      ))}

      {/* PA speaker stacks */}
      {[L + 30, R - 14].map((sx, i) => (
        <g key={i}>
          {Array.from({ length: 6 }, (_, j) => (
            <polygon key={j}
              points={`${sx},${top + 26 + j * 17} ${sx + 22},${top + 28 + j * 17} ${sx + 22},${top + 40 + j * 17} ${sx},${top + 42 + j * 17}`}
              fill="#1c1c24" stroke="#34343c" strokeWidth={0.8} />
          ))}
        </g>
      ))}

      {/* Stage deck + glow */}
      <rect x={L - 26} y={deck - 6} width={R - L + 72} height={12} fill="#1a1a22" />
      <ellipse cx={midX} cy={deck - 6} rx={(R - L) / 2} ry={22} fill="rgba(240,168,64,.18)"
        style={{ animation: 'sdc-glow 5s ease-in-out infinite' }} />

      {/* Footlights — shine up off the deck */}
      {footlights.map((f, i) => (
        <g key={`foot${i}`}>
          <ellipse cx={f.x} cy={deck - 18} rx={11} ry={30} fill={f.color} opacity={0.18}
            style={{ animation: `sdc-shine ${f.dur}s ease-in-out infinite`, animationDelay: `${f.del}s`, mixBlendMode: 'screen' }} />
          <ellipse cx={f.x} cy={deck - 8} rx={9} ry={9} fill="url(#sdc-foot)"
            style={{ animation: `sdc-shine ${f.dur}s ease-in-out infinite`, animationDelay: `${f.del}s` }} />
          <circle cx={f.x} cy={deck - 8} r={3} fill={f.color}
            style={{ animation: `sdc-shine ${f.dur}s ease-in-out infinite`, animationDelay: `${f.del}s` }} />
        </g>
      ))}

      {/* Crowd silhouette */}
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

      {/* Now-playing marquee */}
      <rect x={midX - 96} y={deck + 30} width={192} height={20} rx={3}
        fill="#15151c" stroke="rgba(232,80,116,.4)" strokeWidth={1} />
      <text x={midX} y={deck + 44} textAnchor="middle"
        fontFamily="'Big Shoulders Display', sans-serif" fontWeight="700" fontSize="10"
        letterSpacing="3" fill="rgba(255,140,170,.85)"
        style={{ animation: 'sdc-marquee 3s ease-in-out infinite' }}>
        {marquee.toUpperCase().slice(0, 30)}
      </text>
    </g>

    {/* YouTube player — identical embed path to Concert / Cinema: an unscaled
        foreignObject holding an XHTML div that's scaled with a CSS transform,
        with the hook mounting the iframe into the inner host. */}
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
              title={video?.title ?? 'Couchella'}
              onLoad={onIframeLoad}
              loading="lazy"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              style={STAGE_IFRAME_STYLE}
            />
          )}
          {src && (
            <div style={{
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
    </>
  );
}
