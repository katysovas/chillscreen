'use client';

import { useRef } from 'react';
import type { HTMLAttributes } from 'react';
import { useStagePlayer } from '../../useStagePlayer';
import { StageVideoFrame, STAGE_VIDEO_FO_STYLE, STAGE_VIDEO_WRAPPER_STYLE } from '../../StageVideoFrame';
import { stageChannelForVenueKind } from '@/lib/venues';
import {
  SD_NEON,
  SILENT_DISCO_GND,
  SILENT_DISCO_STAGE_HALF,
  SILENT_DISCO_STAGE_MID_X,
  SILENT_DISCO_STAGE_PUSH_Y,
  SILENT_DISCO_STAGE_SCALE,
  STATIC_SILENT_DISCO_STAGE_PUSH_Y,
  STATIC_SILENT_DISCO_STAGE_SCALE,
  STATIC_SILENT_DISCO_MARQUEE_FONT,
  STATIC_SILENT_DISCO_MARQUEE_X,
  STATIC_SILENT_DISCO_MARQUEE_Y,
} from './constants';

export { SILENT_DISCO_STAGE_MID_X, SILENT_DISCO_STAGE_HALF };

const GND = SILENT_DISCO_GND;
const cx = SILENT_DISCO_STAGE_MID_X;
const ox = cx;
const oy = GND;

const scrW = 340;
const scrH = 192;
const scrX = cx - scrW / 2;
const scrY = 406;
const trussY = 368;
const rigW = 480;

type StageLayout = {
  scale: number;
  pushY: number;
  marqueeSize: number;
  /** Draw scaled glitch title above the stage (static viewport). */
  staticMarquee: boolean;
};

function stageLayout(staticViewport: boolean): StageLayout {
  return staticViewport
    ? {
      scale: STATIC_SILENT_DISCO_STAGE_SCALE,
      pushY: STATIC_SILENT_DISCO_STAGE_PUSH_Y,
      marqueeSize: STATIC_SILENT_DISCO_MARQUEE_FONT,
      staticMarquee: true,
    }
    : {
      scale: SILENT_DISCO_STAGE_SCALE,
      pushY: SILENT_DISCO_STAGE_PUSH_Y,
      marqueeSize: 26,
      staticMarquee: false,
    };
}

function SilentDiscoStageDefs() {
  return (
    <defs>
      <radialGradient id="sds-haze" cx="50%" cy="28%" r="65%">
        <stop offset="0%" stopColor={SD_NEON.magenta} stopOpacity={0.14} />
        <stop offset="45%" stopColor={SD_NEON.cyan} stopOpacity={0.08} />
        <stop offset="100%" stopColor="#03060e" stopOpacity={0} />
      </radialGradient>
      <linearGradient id="sds-beam" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#fff" stopOpacity={0.55} />
        <stop offset="100%" stopColor="#fff" stopOpacity={0} />
      </linearGradient>
      <linearGradient id="sds-truss" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1c2438" />
        <stop offset="100%" stopColor="#0a0f1e" />
      </linearGradient>
      <radialGradient id="sds-ball" cx="35%" cy="30%" r="80%">
        <stop offset="0%" stopColor="#f4faff" />
        <stop offset="55%" stopColor="#9fb6cc" />
        <stop offset="100%" stopColor="#3c4a5c" />
      </radialGradient>
      <filter id="sds-glow" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="4" result="b" />
        <feMerge>
          <feMergeNode in="b" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
    </defs>
  );
}

/** Scaled scene glitch sign — centered above the stage (pure SVG). */
function SilentDiscoGlitchSign({ fontSize }: { fontSize: number }) {
  const lineH = Math.round(fontSize * 0.92);
  const lines = ['SILENT', 'DISCO'] as const;
  const font = 'Oswald, Impact, sans-serif';

  return (
    <g
      transform={`translate(${STATIC_SILENT_DISCO_MARQUEE_X},${STATIC_SILENT_DISCO_MARQUEE_Y}) rotate(-3) skewY(5)`}
    >
      {lines.map((line, i) => {
        const y = fontSize + i * lineH;
        return (
          <g key={line}>
            <text
              x={-2}
              y={y}
              textAnchor="middle"
              fontFamily={font}
              fontWeight={700}
              fontSize={fontSize}
              letterSpacing={2}
              fill="#ff0000"
              opacity={0.85}
            >
              {line}
              <animate attributeName="x" values="-2;2;-3;1;-2" dur="3s" repeatCount="indefinite" />
              <animate
                attributeName="fill"
                values="red;green;blue;yellow;purple;pink;cyan;red"
                dur="3s"
                repeatCount="indefinite"
              />
            </text>
            <text
              x={2}
              y={y}
              textAnchor="middle"
              fontFamily={font}
              fontWeight={700}
              fontSize={fontSize}
              letterSpacing={2}
              fill="#00ff00"
              opacity={0.7}
            >
              {line}
              <animate attributeName="x" values="2;-1;3;-2;2" dur="3s" repeatCount="indefinite" />
              <animate
                attributeName="fill"
                values="lime;cyan;magenta;orange;teal;lime"
                dur="3s"
                repeatCount="indefinite"
              />
            </text>
            <text
              x={0}
              y={y}
              textAnchor="middle"
              fontFamily={font}
              fontWeight={700}
              fontSize={fontSize}
              letterSpacing={2}
              fill="#000"
            >
              {line}
            </text>
          </g>
        );
      })}
    </g>
  );
}

/** Headphone earcup colors cycling across the truss. */
const LENS_COLORS = [
  SD_NEON.magenta,
  SD_NEON.cyan,
  SD_NEON.laser,
  SD_NEON.blue,
  SD_NEON.amber,
  SD_NEON.violet,
  SD_NEON.magenta,
];

const BEAMS = [
  { x: cx - 190, c: SD_NEON.magenta, a1: -36, a2: 20, dur: 5.2 },
  { x: cx - 95, c: SD_NEON.cyan, a1: -24, a2: 28, dur: 6.4 },
  { x: cx, c: SD_NEON.laser, a1: -16, a2: 16, dur: 4.6 },
  { x: cx + 95, c: SD_NEON.violet, a1: -12, a2: 12, dur: 5.7 },
  { x: cx + 190, c: SD_NEON.blue, a1: -16, a2: 22, dur: 6.1 },
] as const;

/** Glowsticks waved above the crowd (local coords, pre-scale). */
const GLOWSTICKS = [
  { x: cx - 265, c: SD_NEON.magenta, dur: 1.7 },
  { x: cx - 215, c: SD_NEON.laser, dur: 2.1 },
  { x: cx - 130, c: SD_NEON.cyan, dur: 1.9 },
  { x: cx + 125, c: SD_NEON.amber, dur: 2.3 },
  { x: cx + 205, c: SD_NEON.blue, dur: 1.8 },
  { x: cx + 262, c: SD_NEON.violet, dur: 2.0 },
] as const;

type SilentDiscoStageShellProps = {
  marquee?: string;
  idleScreen?: boolean;
  layout: StageLayout;
};

/** Headphone-rave rig — disco ball, laser truss, LED frame (no video). */
function SilentDiscoStageShell({ marquee = 'SILENT DISCO', idleScreen = true, layout }: SilentDiscoStageShellProps) {
  const { scale: S, pushY, marqueeSize, staticMarquee } = layout;
  const deck = GND;
  const fontFamily = 'system-ui, sans-serif';

  return (
    <>
      <SilentDiscoStageDefs />
      <g transform={`translate(0, ${pushY})`}>
        <g transform={`translate(${ox},${oy}) scale(${S}) translate(${-ox},${-oy})`}>

          <ellipse cx={cx} cy={deck - 120} rx={rigW * 0.55} ry={140} fill="url(#sds-haze)" opacity={0.85}>
            <animate attributeName="opacity" values="0.65;1;0.65" dur="5s" repeatCount="indefinite" />
          </ellipse>

          {BEAMS.map((b, i) => (
            <g key={i} transform={`translate(${b.x},${trussY + 14})`}>
              <polygon
                points="-28,200 0,0 28,200"
                fill="url(#sds-beam)"
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
                <animate attributeName="opacity" values="0.12;0.5;0.12" dur={`${b.dur * 0.6}s`} repeatCount="indefinite" />
              </polygon>
              <polygon points="-14,200 0,0 14,200" fill={b.c} opacity={0.3} style={{ mixBlendMode: 'screen' }}>
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

          {/* disco ball hanging above the marquee */}
          <g>
            <line x1={cx} y1={trussY - 92} x2={cx} y2={trussY - 64} stroke="#2c3850" strokeWidth={2.5} />
            <circle cx={cx} cy={trussY - 44} r={22} fill="url(#sds-ball)" />
            <g stroke="rgba(8,14,28,.55)" strokeWidth={1}>
              <line x1={cx - 22} y1={trussY - 44} x2={cx + 22} y2={trussY - 44} />
              <line x1={cx - 19} y1={trussY - 53} x2={cx + 19} y2={trussY - 53} />
              <line x1={cx - 19} y1={trussY - 35} x2={cx + 19} y2={trussY - 35} />
              <line x1={cx} y1={trussY - 66} x2={cx} y2={trussY - 22} />
              <line x1={cx - 12} y1={trussY - 63} x2={cx - 12} y2={trussY - 25} />
              <line x1={cx + 12} y1={trussY - 63} x2={cx + 12} y2={trussY - 25} />
            </g>
            {/* sparkle flecks */}
            {[
              { dx: -34, dy: -8, c: SD_NEON.cyan },
              { dx: 36, dy: -16, c: SD_NEON.magenta },
              { dx: -26, dy: -38, c: SD_NEON.laser },
              { dx: 30, dy: 8, c: SD_NEON.amber },
            ].map((s, i) => (
              <circle key={i} cx={cx + s.dx} cy={trussY - 44 + s.dy} r={2.4} fill={s.c} filter="url(#sds-glow)">
                <animate attributeName="opacity" values="0;1;0" dur={`${1.4 + i * 0.5}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </g>

          <rect
            x={cx - rigW / 2}
            y={trussY}
            width={rigW}
            height={22}
            rx={4}
            fill="url(#sds-truss)"
            stroke="rgba(54,227,255,.18)"
            strokeWidth={1}
          />
          {LENS_COLORS.map((col, i) => {
            const lx = cx - rigW / 2 + 36 + i * ((rigW - 72) / (LENS_COLORS.length - 1));
            return (
              <g key={i}>
                <circle cx={lx} cy={trussY + 11} r={7} fill={col} filter="url(#sds-glow)" opacity={0.9}>
                  <animate attributeName="opacity" values="1;0.4;1" dur={`${1.4 + i * 0.25}s`} repeatCount="indefinite" />
                </circle>
                <circle cx={lx} cy={trussY + 11} r={3.5} fill="#fff" opacity={0.85} />
              </g>
            );
          })}

          {/* speaker towers wrapped in LED rings (silent... but they look loud) */}
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
                  fill="#0d1426"
                  stroke="rgba(54,227,255,.16)"
                  strokeWidth={1}
                />
              ))}
              {Array.from({ length: 5 }, (_, j) => (
                <circle key={j} cx={27} cy={j * 38 + 17} r={10} fill="none" stroke={j % 2 ? SD_NEON.magenta : SD_NEON.cyan} strokeWidth={2} opacity={0.7}>
                  <animate attributeName="opacity" values="0.3;0.95;0.3" dur={`${1.2 + j * 0.3}s`} repeatCount="indefinite" />
                </circle>
              ))}
              <ellipse cx={27} cy={188} rx={20} ry={6} fill="#141d33" opacity={0.7} />
            </g>
          ))}

          {!staticMarquee && (
            <>
          {/* headphone marquee mark */}
          <g filter="url(#sds-glow)">
            <path
              d={`M${cx - 56},${trussY - 18} a22 22 0 0 1 44 0`}
              fill="none"
              stroke={SD_NEON.cyan}
              strokeWidth={3.5}
              transform={`translate(${-86},0)`}
            />
            <rect x={cx - 148} y={trussY - 20} width={9} height={14} rx={3} fill={SD_NEON.magenta}>
              <animate attributeName="fill" values={`${SD_NEON.magenta};${SD_NEON.cyan};${SD_NEON.magenta}`} dur="2.4s" repeatCount="indefinite" />
            </rect>
            <rect x={cx - 105} y={trussY - 20} width={9} height={14} rx={3} fill={SD_NEON.cyan}>
              <animate attributeName="fill" values={`${SD_NEON.cyan};${SD_NEON.magenta};${SD_NEON.cyan}`} dur="2.4s" repeatCount="indefinite" />
            </rect>
          </g>
          <text
            x={cx + 22}
            y={trussY - 12}
            textAnchor="middle"
            fontFamily="Anton, Impact, sans-serif"
            fontSize={marqueeSize}
            letterSpacing={3}
            fill="#eefbff"
            filter="url(#sds-glow)"
          >
            SILENT DISCO
            <animate attributeName="opacity" values="1;0.85;0.5;0.95;1" dur="4.5s" repeatCount="indefinite" />
          </text>
            </>
          )}

          <rect
            x={scrX - 10}
            y={scrY - 10}
            width={scrW + 20}
            height={scrH + 20}
            rx={10}
            fill="#000"
            stroke={SD_NEON.edge}
            strokeWidth={2}
          />
          <rect x={scrX - 4} y={scrY - 4} width={scrW + 8} height={scrH + 8} rx={8} fill="none" stroke={SD_NEON.magenta} strokeWidth={1.5} opacity={0.75}>
            <animate attributeName="stroke" values={`${SD_NEON.magenta};${SD_NEON.cyan};${SD_NEON.laser};${SD_NEON.violet};${SD_NEON.magenta}`} dur="5s" repeatCount="indefinite" />
          </rect>
          <rect x={scrX} y={scrY} width={scrW} height={scrH} rx={6} fill="#04060f" stroke="#1c2438" strokeWidth={2} />

          {idleScreen && (
            <>
              <rect
                x={scrX + 4}
                y={scrY + 4}
                width={scrW - 8}
                height={scrH - 8}
                rx={4}
                fill="#060a16"
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
              <circle cx={cx} cy={scrY + scrH / 2} r={36} fill="none" stroke={SD_NEON.cyan} strokeWidth={2} opacity={0.85}>
                <animate attributeName="r" values="32;38;32" dur="2.4s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.7;1;0.7" dur="2.4s" repeatCount="indefinite" />
              </circle>
              <polygon
                points={`${cx + 8},${scrY + scrH / 2 - 14} ${cx + 8},${scrY + scrH / 2 + 14} ${cx + 28},${scrY + scrH / 2}`}
                fill={SD_NEON.cyan}
                opacity={0.9}
              />
            </>
          )}

          {/* DJ table — rows of charging headphones glowing under the screen */}
          <g transform={`translate(${cx - 215},0)`}>
            <rect x={120} y={596} width={190} height={64} rx={6} fill="#0a0f1e" stroke="rgba(54,227,255,.3)" strokeWidth={1.5} />
            <rect x={120} y={596} width={190} height={10} rx={5} fill={SD_NEON.cyan} opacity={0.45}>
              <animate attributeName="opacity" values="0.25;0.6;0.25" dur="2.4s" repeatCount="indefinite" />
            </rect>
            {[
              { x: 142, c: SD_NEON.blue, begin: '0s' },
              { x: 182, c: SD_NEON.laser, begin: '0.7s' },
              { x: 222, c: SD_NEON.magenta, begin: '1.4s' },
              { x: 262, c: SD_NEON.amber, begin: '0.3s' },
            ].map((h, i) => (
              <g key={i}>
                <circle cx={h.x} cy={586} r={6} fill={h.c}>
                  <animate attributeName="opacity" values="0.35;1;0.35" dur="2.2s" begin={h.begin} repeatCount="indefinite" />
                </circle>
                <circle cx={h.x + 16} cy={586} r={6} fill={h.c}>
                  <animate attributeName="opacity" values="0.35;1;0.35" dur="2.2s" begin={h.begin} repeatCount="indefinite" />
                </circle>
                <path d={`M${h.x - 6} 584 a14 14 0 0 1 28 0`} fill="none" stroke="#1c2a4a" strokeWidth={3} />
              </g>
            ))}
          </g>


          {/* glowsticks waving above the crowd */}
          {GLOWSTICKS.map((g, i) => (
            <line
              key={i}
              x1={g.x}
              y1={deck + 4}
              x2={g.x + 4}
              y2={deck - 18}
              stroke={g.c}
              strokeWidth={4}
              strokeLinecap="round"
              filter="url(#sds-glow)"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                values={`-24 ${g.x} ${deck + 6};24 ${g.x} ${deck + 6};-24 ${g.x} ${deck + 6}`}
                dur={`${g.dur}s`}
                repeatCount="indefinite"
              />
            </line>
          ))}

          <rect x={cx - 168} y={deck + 20} width={336} height={22} rx={3} fill="#080d1a" stroke="rgba(54,227,255,.25)" strokeWidth={1} />
          <text
            x={cx}
            y={deck + 35}
            textAnchor="middle"
            fontFamily={fontFamily}
            fontWeight={700}
            fontSize={8.5}
            letterSpacing={1.5}
            fill={SD_NEON.cyan}
            opacity={0.9}
          >
            {(marquee || 'SILENT DISCO').toUpperCase()}
          </text>
        </g>
      </g>
      {staticMarquee && <SilentDiscoGlitchSign fontSize={marqueeSize} />}
    </>
  );
}

/**
 * Floating headphones above the DJ table — rendered as a separate top layer so
 * they stay visible in front of the video screen.
 */
function FloatingHeadphones({ layout }: { layout: StageLayout }) {
  const { scale: S, pushY } = layout;
  return (
    <g transform={`translate(0, ${pushY})`} style={{ pointerEvents: 'none' }}>
      <g transform={`translate(${ox},${oy}) scale(${S}) translate(${-ox},${-oy})`}>
        <g transform={`translate(${cx - 215},0)`}>
          {[
            { x: 142, y: 582, c: SD_NEON.violet, dur: 2.8, begin: '0s' },
            { x: 192, y: 578, c: SD_NEON.cyan, dur: 3.4, begin: '0.6s' },
            { x: 242, y: 580, c: SD_NEON.magenta, dur: 3.0, begin: '1.2s' },
            { x: 292, y: 583, c: SD_NEON.laser, dur: 3.6, begin: '0.9s' },
          ].map((h, i) => (
            <g key={i} filter="url(#sds-glow)">
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0,0;0,-5;0,0"
                dur={`${h.dur}s`}
                begin={h.begin}
                repeatCount="indefinite"
              />
              <path
                d={`M${h.x - 10} ${h.y} a10 10 0 0 1 20 0`}
                fill="none"
                stroke={h.c}
                strokeWidth={2.5}
              />
              <rect x={h.x - 13} y={h.y - 1.5} width={6.5} height={11} rx={3} fill={h.c}>
                <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" begin={h.begin} repeatCount="indefinite" />
              </rect>
              <rect x={h.x + 6.5} y={h.y - 1.5} width={6.5} height={11} rx={3} fill={h.c}>
                <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" begin={h.begin} repeatCount="indefinite" />
              </rect>
            </g>
          ))}
        </g>
      </g>
    </g>
  );
}

const SILENT_DISCO_STAGE_CHANNEL = stageChannelForVenueKind('silent-disco', 0);

function SilentDiscoStageLive({ layout }: { layout: StageLayout }) {
  const { scale: S, pushY } = layout;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { video, src, vidKey, onIframeLoad } = useStagePlayer({
    live: true,
    channel: SILENT_DISCO_STAGE_CHANNEL,
    iframeRef,
  });

  const videoFoX = ox + S * (scrX - ox);
  const videoFoY = oy + S * (scrY - oy) + pushY;
  const videoFoW = scrW * S;
  const videoFoH = scrH * S;
  const marquee = video?.title ?? 'LOADING…';

  return (
    <>
      <SilentDiscoStageShell marquee={marquee} idleScreen={false} layout={layout} />
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
      <FloatingHeadphones layout={layout} />
    </>
  );
}

/** Silent Disco main stage — headphone rave rig with synchronized live video. */
export function SilentDiscoStage({
  live = false,
  staticViewport = false,
}: {
  live?: boolean;
  staticViewport?: boolean;
}) {
  const layout = stageLayout(staticViewport);
  if (!live) {
    return (
      <>
        <SilentDiscoStageShell layout={layout} />
        <FloatingHeadphones layout={layout} />
      </>
    );
  }
  return <SilentDiscoStageLive layout={layout} />;
}
