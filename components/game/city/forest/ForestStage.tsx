'use client';

import { useRef } from 'react';
import type { HTMLAttributes } from 'react';
import { useStagePlayer } from '../../useStagePlayer';
import { StageVideoFrame, STAGE_VIDEO_FO_STYLE, STAGE_VIDEO_WRAPPER_STYLE } from '../../StageVideoFrame';
import { stageChannelForVenueKind } from '@/lib/venues';
import {
  FOREST_GND,
  FOREST_NEON,
  FOREST_STAGE_HALF,
  FOREST_STAGE_MID_X,
  FOREST_STAGE_PUSH_Y,
  FOREST_STAGE_SCALE,
  STATIC_FOREST_STAGE_PUSH_Y,
  STATIC_FOREST_STAGE_SCALE,
} from './constants';

export { FOREST_STAGE_MID_X, FOREST_STAGE_HALF };

const GND = FOREST_GND;
const cx = FOREST_STAGE_MID_X;
const ox = cx;
const oy = GND;

const scrW = 340;
const scrH = 192;
const scrX = cx - scrW / 2;
const scrY = 406;
const trussY = 368;
const rigW = 480;

const LENS_COLORS = [
  FOREST_NEON.green,
  FOREST_NEON.cyan,
  FOREST_NEON.violet,
  FOREST_NEON.magenta,
  FOREST_NEON.amber,
  FOREST_NEON.cyan,
  FOREST_NEON.green,
];

const BEAMS = [
  { x: cx - 180, c: FOREST_NEON.green, a1: -34, a2: 18, dur: 6.5 },
  { x: cx - 90, c: FOREST_NEON.cyan, a1: -22, a2: 26, dur: 7.8 },
  { x: cx, c: FOREST_NEON.violet, a1: -14, a2: 14, dur: 5.6 },
  { x: cx + 90, c: FOREST_NEON.magenta, a1: -10, a2: 10, dur: 6.9 },
  { x: cx + 180, c: FOREST_NEON.cyan, a1: -14, a2: 18, dur: 7.2 },
] as const;

/** Firefly drift points around the rig (local coords, pre-scale). */
const FIREFLIES = [
  { x: cx - 270, y: trussY + 60, dur: 6.4 },
  { x: cx - 220, y: trussY - 30, dur: 7.6 },
  { x: cx + 235, y: trussY + 40, dur: 5.8 },
  { x: cx + 275, y: trussY - 20, dur: 8.2 },
  { x: cx - 150, y: trussY - 60, dur: 7.0 },
  { x: cx + 160, y: trussY - 70, dur: 6.2 },
] as const;

type StageLayout = {
  scale: number;
  pushY: number;
};

function stageLayout(staticViewport: boolean): StageLayout {
  return staticViewport
    ? { scale: STATIC_FOREST_STAGE_SCALE, pushY: STATIC_FOREST_STAGE_PUSH_Y }
    : { scale: FOREST_STAGE_SCALE, pushY: FOREST_STAGE_PUSH_Y };
}

type ForestStageShellProps = {
  marquee?: string;
  idleScreen?: boolean;
  layout: StageLayout;
};

/** Glowing-woods rig — living canopy truss, trunk towers, LED frame (no video). */
function ForestStageShell({ marquee = 'THE FOREST', idleScreen = true, layout }: ForestStageShellProps) {
  const { scale: S, pushY } = layout;
  const deck = GND;
  const fontFamily = 'system-ui, sans-serif';

  return (
    <>
      <g transform={`translate(0, ${pushY})`}>
        <g transform={`translate(${ox},${oy}) scale(${S}) translate(${-ox},${-oy})`}>
          <defs>
            <radialGradient id="fs-haze" cx="50%" cy="28%" r="65%">
              <stop offset="0%" stopColor={FOREST_NEON.green} stopOpacity={0.14} />
              <stop offset="45%" stopColor={FOREST_NEON.violet} stopOpacity={0.08} />
              <stop offset="100%" stopColor="#04100b" stopOpacity={0} />
            </radialGradient>
            <linearGradient id="fs-beam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fff" stopOpacity={0.55} />
              <stop offset="100%" stopColor="#fff" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="fs-truss" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1b2e20" />
              <stop offset="100%" stopColor="#0c1810" />
            </linearGradient>
            <filter id="fs-glow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="4" result="b" />
              <feMerge>
                <feMergeNode in="b" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ellipse cx={cx} cy={deck - 120} rx={rigW * 0.55} ry={140} fill="url(#fs-haze)" opacity={0.85}>
            <animate attributeName="opacity" values="0.65;1;0.65" dur="7s" repeatCount="indefinite" />
          </ellipse>

          {BEAMS.map((b, i) => (
            <g key={i} transform={`translate(${b.x},${trussY + 14})`}>
              <polygon
                points="-28,200 0,0 28,200"
                fill="url(#fs-beam)"
                opacity={0.35}
                style={{ mixBlendMode: 'screen' }}
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values={`${b.a1} 0 0;${b.a2} 0 0;${b.a1} 0 0`}
                  dur={`${b.dur}s`}
                  repeatCount="indefinite"
                />
                <animate attributeName="opacity" values="0.12;0.48;0.12" dur={`${b.dur * 0.65}s`} repeatCount="indefinite" />
              </polygon>
              <polygon points="-14,200 0,0 14,200" fill={b.c} opacity={0.28} style={{ mixBlendMode: 'screen' }}>
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  values={`${b.a1} 0 0;${b.a2} 0 0;${b.a1} 0 0`}
                  dur={`${b.dur}s`}
                  repeatCount="indefinite"
                />
              </polygon>
            </g>
          ))}

          {/* canopy crown above the truss — leafy arcs */}
          <g fill="#143424">
            <circle cx={cx - 170} cy={trussY - 30} r={42} />
            <circle cx={cx - 80} cy={trussY - 48} r={52} />
            <circle cx={cx + 20} cy={trussY - 54} r={56} />
            <circle cx={cx + 120} cy={trussY - 46} r={50} />
            <circle cx={cx + 195} cy={trussY - 28} r={40} />
          </g>
          <g fill="#1f5439" opacity={0.9}>
            <circle cx={cx - 120} cy={trussY - 54} r={22} />
            <circle cx={cx + 60} cy={trussY - 66} r={24} />
            <circle cx={cx + 165} cy={trussY - 46} r={18} />
          </g>

          <rect
            x={cx - rigW / 2}
            y={trussY}
            width={rigW}
            height={22}
            rx={4}
            fill="url(#fs-truss)"
            stroke="rgba(57,255,136,.18)"
            strokeWidth={1}
          />
          {LENS_COLORS.map((col, i) => {
            const lx = cx - rigW / 2 + 36 + i * ((rigW - 72) / (LENS_COLORS.length - 1));
            return (
              <g key={i}>
                <circle cx={lx} cy={trussY + 11} r={7} fill={col} filter="url(#fs-glow)" opacity={0.9}>
                  <animate attributeName="opacity" values="1;0.45;1" dur={`${2 + i * 0.35}s`} repeatCount="indefinite" />
                </circle>
                <circle cx={lx} cy={trussY + 11} r={3.5} fill="#fff" opacity={0.85} />
              </g>
            );
          })}

          {/* trunk speaker towers — bark columns with moss caps */}
          {[cx - 210, cx + 210].map((tx, i) => (
            <g key={i} transform={`translate(${tx - 27},${trussY + 28})`}>
              {Array.from({ length: 5 }, (_, j) => (
                <rect
                  key={j}
                  x={0}
                  y={j * 38}
                  width={54}
                  height={34}
                  rx={5}
                  fill="#10231a"
                  stroke="rgba(57,255,136,.14)"
                  strokeWidth={1}
                />
              ))}
              <path d={`M-6,-4 Q27,-26 60,-4 Z`} fill="#1f5439" />
              <ellipse cx={27} cy={188} rx={20} ry={6} fill="#1a3326" opacity={0.7} />
              {/* ivy vine crawling the tower */}
              <path
                d="M6,180 Q-2,140 8,104 Q18,70 4,36"
                fill="none"
                stroke="#2dd4a0"
                strokeWidth={2}
                opacity={0.55}
              />
              <circle cx={6} cy={120} r={2.6} fill={FOREST_NEON.mint} opacity={0.85}>
                <animate attributeName="opacity" values="0.4;1;0.4" dur="3.2s" repeatCount="indefinite" />
              </circle>
              <circle cx={9} cy={62} r={2.6} fill={FOREST_NEON.mint} opacity={0.85}>
                <animate attributeName="opacity" values="1;0.4;1" dur="2.7s" repeatCount="indefinite" />
              </circle>
            </g>
          ))}

          <text
            x={cx}
            y={trussY - 18}
            textAnchor="middle"
            fontFamily="Anton, Impact, sans-serif"
            fontSize={28}
            letterSpacing={3}
            fill="#ecfff4"
            filter="url(#fs-glow)"
          >
            THE FOREST
            <animate attributeName="opacity" values="1;0.88;0.55;0.95;1" dur="5.5s" repeatCount="indefinite" />
          </text>

          <rect
            x={scrX - 10}
            y={scrY - 10}
            width={scrW + 20}
            height={scrH + 20}
            rx={10}
            fill="#000"
            stroke={FOREST_NEON.edge}
            strokeWidth={2}
          />
          <rect x={scrX - 4} y={scrY - 4} width={scrW + 8} height={scrH + 8} rx={8} fill="none" stroke={FOREST_NEON.green} strokeWidth={1.5} opacity={0.75}>
            <animate attributeName="stroke" values={`${FOREST_NEON.green};${FOREST_NEON.cyan};${FOREST_NEON.violet};${FOREST_NEON.green}`} dur="6s" repeatCount="indefinite" />
          </rect>
          <rect x={scrX} y={scrY} width={scrW} height={scrH} rx={6} fill="#020a07" stroke="#1b2e20" strokeWidth={2} />

          {idleScreen && (
            <>
              <rect
                x={scrX + 4}
                y={scrY + 4}
                width={scrW - 8}
                height={scrH - 8}
                rx={4}
                fill="#04100b"
              />
              {Array.from({ length: 7 }, (_, i) => (
                <rect
                  key={i}
                  x={scrX + 8}
                  y={scrY + 10 + i * 26}
                  width={scrW - 16}
                  height={2}
                  fill="rgba(255,255,255,.08)"
                />
              ))}
              <circle cx={cx} cy={scrY + scrH / 2} r={36} fill="none" stroke={FOREST_NEON.green} strokeWidth={2} opacity={0.85}>
                <animate attributeName="r" values="32;38;32" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;1;0.7" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <polygon
                points={`${cx + 8},${scrY + scrH / 2 - 14} ${cx + 8},${scrY + scrH / 2 + 14} ${cx + 28},${scrY + scrH / 2}`}
                fill={FOREST_NEON.green}
                opacity={0.9}
              />
            </>
          )}

          {/* fireflies drifting around the rig */}
          {FIREFLIES.map((f, i) => (
            <circle key={i} cx={f.x} cy={f.y} r={2.4} fill="#d9ffb0">
              <animate
                attributeName="opacity"
                values="0.15;0.95;0.3;0.85;0.15"
                dur={`${3.4 + (i % 4) * 0.7}s`}
                repeatCount="indefinite"
              />
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0;9,-13;-7,-6;0,0"
                dur={`${f.dur}s`}
                repeatCount="indefinite"
              />
            </circle>
          ))}

          <rect x={cx - rigW / 2 + 20} y={deck - 8} width={rigW - 40} height={8} rx={2} fill="#0c1c12" stroke="rgba(57,255,136,.25)" strokeWidth={1} />
          <line
            x1={cx - rigW / 2 + 24}
            y1={deck - 4}
            x2={cx + rigW / 2 - 24}
            y2={deck - 4}
            stroke={FOREST_NEON.green}
            strokeWidth={2}
            strokeDasharray="4 22"
            opacity={0.75}
          >
            <animate attributeName="opacity" values="0.5;0.95;0.5" dur="3s" repeatCount="indefinite" />
          </line>

          {/* crowd silhouette */}
          <path
            d={`M${cx - rigW / 2 - 40},${deck + 18}
              ${Array.from({ length: 32 }, (_, i) => {
                const px = cx - rigW / 2 - 40 + i * 18;
                const py = deck + 8 + (i % 4) * 4;
                return `L${px},${py}`;
              }).join(' ')}
              L${cx + rigW / 2 + 40},${deck + 28} L${cx - rigW / 2 - 40},${deck + 36} Z`}
            fill="#010604"
          />
          {Array.from({ length: 14 }, (_, i) => (
            <circle
              key={i}
              cx={cx - rigW / 2 + 30 + i * 34}
              cy={deck + 10 + (i % 3) * 5}
              r={2.2}
              fill="#c9ffe6"
              opacity={0.8}
            >
              <animate attributeName="opacity" values="0;1;0" dur={`${2.3 + (i % 5) * 0.3}s`} repeatCount="indefinite" />
            </circle>
          ))}

          {/* glowing shroom footlights */}
          {[cx - rigW / 2 - 18, cx + rigW / 2 + 12].map((mx, i) => (
            <g key={i}>
              <rect x={mx} y={deck - 12} width={7} height={12} rx={3} fill="#cfeee0" opacity={0.85} />
              <path d={`M${mx - 9},${deck - 10} Q${mx + 3.5},${deck - 28} ${mx + 16},${deck - 10} Z`} fill={i === 0 ? FOREST_NEON.mint : FOREST_NEON.violet}>
                <animate attributeName="opacity" values="0.7;1;0.7" dur={`${3 + i}s`} repeatCount="indefinite" />
              </path>
            </g>
          ))}

          <rect x={cx - 168} y={deck + 20} width={336} height={22} rx={3} fill="#08160f" stroke="rgba(57,255,136,.25)" strokeWidth={1} />
          <text
            x={cx}
            y={deck + 35}
            textAnchor="middle"
            fontFamily={fontFamily}
            fontWeight={700}
            fontSize={8.5}
            letterSpacing={1.5}
            fill={FOREST_NEON.green}
            opacity={0.9}
          >
            {(marquee || 'THE FOREST').toUpperCase()}
          </text>
        </g>
      </g>
    </>
  );
}

const FOREST_STAGE_CHANNEL = stageChannelForVenueKind('forest', 0);

function ForestStageLive({ layout }: { layout: StageLayout }) {
  const { scale: S, pushY } = layout;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { video, src, vidKey, onIframeLoad } = useStagePlayer({
    live: true,
    channel: FOREST_STAGE_CHANNEL,
    iframeRef,
  });

  const videoFoX = ox + S * (scrX - ox);
  const videoFoY = oy + S * (scrY - oy) + pushY;
  const videoFoW = scrW * S;
  const videoFoH = scrH * S;
  const marquee = video?.title ?? 'LOADING…';

  return (
    <>
      <ForestStageShell marquee={marquee} idleScreen={false} layout={layout} />
      <foreignObject
        x={videoFoX}
        y={videoFoY}
        width={videoFoW}
        height={videoFoH}
        data-stage-video-fo
        style={STAGE_VIDEO_FO_STYLE}
      >
        <div
          {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as HTMLAttributes<HTMLDivElement>)}
          style={{
            width: scrW,
            transform: `scale(${S})`,
            transformOrigin: 'top left',
            ...STAGE_VIDEO_WRAPPER_STYLE,
          }}
        >
          <StageVideoFrame
            iframeRef={iframeRef}
            src={src}
            vidKey={vidKey}
            title={video?.title}
            onIframeLoad={onIframeLoad}
            width={scrW}
            height={scrH}
            borderRadius={6}
            loading="eager"
          />
        </div>
      </foreignObject>
    </>
  );
}

/** The Forest main stage — glowing canopy rig with synchronized live video. */
export function ForestStage({
  live = false,
  staticViewport = false,
}: {
  live?: boolean;
  staticViewport?: boolean;
}) {
  const layout = stageLayout(staticViewport);
  if (!live) return <ForestStageShell layout={layout} />;
  return <ForestStageLive layout={layout} />;
}
