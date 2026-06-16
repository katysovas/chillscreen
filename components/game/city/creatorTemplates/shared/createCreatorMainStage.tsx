'use client';

import { useRef } from 'react';
import type { HTMLAttributes } from 'react';
import { useOptionalCreatorStage } from '@/lib/stages/CreatorStageContext';
import { nowPlayingStream } from '@/lib/stages/runtime';
import { streamChannelMarquee } from '@/lib/stages/streamLabel';
import { useStagePlayer } from '../../../useStagePlayer';
import { StageVideoFrame, STAGE_VIDEO_FO_STYLE, STAGE_VIDEO_WRAPPER_STYLE } from '../../../StageVideoFrame';
import { stageChannelForVenueKind } from '@/lib/venues';
import type { CreatorStageConstants } from './types';

type StageShellProps = {
  idleScreen?: boolean;
};

export function createCreatorMainStage(C: CreatorStageConstants) {
  const GND = C.TENTAROO_GND;
  const cx = C.WHICH_STAGE_MID_X;
  const S = C.WHICH_STAGE_SCALE;
  const pushY = C.WHICH_STAGE_PUSH_Y;
  const ox = cx;
  const oy = GND;

  const scrW = 340;
  const scrH = 192;
  const scrX = cx - scrW / 2;
  const scrY = C.WHICH_STAGE_SCREEN_Y ?? 406;
  const trussY = C.WHICH_STAGE_TRUSS_Y ?? 368;
  const streamLabelY = C.WHICH_STAGE_STREAM_LABEL_Y ?? trussY + 38;
  const speakerY = C.WHICH_STAGE_SPEAKER_Y ?? trussY + 28;
  const rigW = 480;
  const isChill = C.idPrefix === 'chill' || C.idPrefix === 'live';
  const marqueeGradId = `${C.idPrefix}-marquee`;

  const LENS_COLORS = [
    C.WHICH_NEON.cyan,
    C.WHICH_NEON.green,
    C.WHICH_NEON.magenta,
    C.WHICH_NEON.amber,
    C.WHICH_NEON.violet,
    C.WHICH_NEON.green,
    C.WHICH_NEON.cyan,
  ];

  const BEAMS = [
    { x: cx - 180, c: C.WHICH_NEON.cyan, a1: -34, a2: 18, dur: 6.5 },
    { x: cx - 90, c: C.WHICH_NEON.green, a1: -22, a2: 26, dur: 7.8 },
    { x: cx, c: C.WHICH_NEON.magenta, a1: -14, a2: 14, dur: 5.6 },
    { x: cx + 90, c: C.WHICH_NEON.amber, a1: -10, a2: 10, dur: 6.9 },
    { x: cx + 180, c: C.WHICH_NEON.violet, a1: -14, a2: 18, dur: 7.2 },
  ] as const;

  const hazeId = `${C.idPrefix}-haze`;
  const beamId = `${C.idPrefix}-beam`;
  const trussGradId = `${C.idPrefix}-truss`;
  const glowId = `${C.idPrefix}-glow`;

  function CreatorStageShell({ idleScreen = true }: StageShellProps) {
    const deck = GND;
    const creator = useOptionalCreatorStage();
    const stream = creator ? nowPlayingStream(creator) : null;
    const artistMarquee = stream ? streamChannelMarquee(stream) : null;

    return (
      <>
        <g transform={`translate(0, ${pushY})`}>
          <g transform={`translate(${ox},${oy}) scale(${S}) translate(${-ox},${-oy})`}>
            <defs>
              <radialGradient id={hazeId} cx="50%" cy="28%" r="65%">
                <stop offset="0%" stopColor={C.WHICH_NEON.cyan} stopOpacity={0.14} />
                <stop offset="45%" stopColor={C.WHICH_NEON.green} stopOpacity={0.08} />
                <stop offset="100%" stopColor="#04100b" stopOpacity={0} />
              </radialGradient>
              <linearGradient id={beamId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity={0.55} />
                <stop offset="100%" stopColor="#fff" stopOpacity={0} />
              </linearGradient>
              <linearGradient id={trussGradId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={isChill ? '#243832' : '#1b2a22'} />
                <stop offset="100%" stopColor={isChill ? '#121f1a' : '#0d1712'} />
              </linearGradient>
              {isChill && (
                <linearGradient id={marqueeGradId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1a2e28" />
                  <stop offset="100%" stopColor="#0f1c18" />
                </linearGradient>
              )}
              <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="4" result="b" />
                <feMerge>
                  <feMergeNode in="b" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <ellipse cx={cx} cy={deck - 120} rx={rigW * 0.55} ry={140} fill={`url(#${hazeId})`} opacity={0.85}>
              <animate attributeName="opacity" values="0.65;1;0.65" dur="7s" repeatCount="indefinite" />
            </ellipse>

            {[cx - 210, cx + 210].map((tx, i) => (
              <g key={`spk-${i}`} transform={`translate(${tx - 27},${speakerY})`}>
                {Array.from({ length: 5 }, (_, j) => (
                  <rect
                    key={j}
                    x={0}
                    y={j * 38}
                    width={54}
                    height={34}
                    rx={5}
                    fill="#10201a"
                    stroke="rgba(56,245,176,.14)"
                    strokeWidth={1}
                  />
                ))}
                <ellipse cx={27} cy={188} rx={20} ry={6} fill="#1a2f26" opacity={0.7} />
              </g>
            ))}

            {BEAMS.map((b, i) => (
              <g key={i} transform={`translate(${b.x},${trussY + 14})`}>
                <polygon
                  points="-28,200 0,0 28,200"
                  fill={`url(#${beamId})`}
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

            {isChill && (
              <rect
                x={cx - rigW / 2 - 4}
                y={trussY + 24}
                width={rigW + 8}
                height={6}
                rx={3}
                fill="rgba(0,0,0,0.28)"
                opacity={0.55}
              />
            )}

            <rect
              x={cx - rigW / 2}
              y={trussY}
              width={rigW}
              height={22}
              rx={4}
              fill={`url(#${trussGradId})`}
              stroke={isChill ? 'rgba(46,61,69,0.45)' : 'rgba(56,245,176,.18)'}
              strokeWidth={1}
            />
            {isChill && (
              <rect
                x={cx - rigW / 2 + 2}
                y={trussY + 1}
                width={rigW - 4}
                height={5}
                rx={2}
                fill="rgba(255,255,255,0.07)"
              />
            )}
            {LENS_COLORS.map((col, i) => {
              const lx = cx - rigW / 2 + 36 + i * ((rigW - 72) / (LENS_COLORS.length - 1));
              return (
                <g key={i}>
                  {isChill && (
                    <circle cx={lx} cy={trussY + 11} r={9} fill="none" stroke="rgba(46,61,69,0.5)" strokeWidth={1} />
                  )}
                  <circle cx={lx} cy={trussY + 11} r={7} fill={col} filter={`url(#${glowId})`} opacity={0.9}>
                    <animate attributeName="opacity" values="1;0.45;1" dur={`${2 + i * 0.35}s`} repeatCount="indefinite" />
                  </circle>
                  <circle cx={lx} cy={trussY + 11} r={3.5} fill="#fff" opacity={0.85} />
                </g>
              );
            })}

            {artistMarquee && (
              <g data-stage-artist-marquee>
                <rect
                  x={cx - 172}
                  y={streamLabelY}
                  width={344}
                  height={28}
                  rx={4}
                  fill={isChill ? `url(#${marqueeGradId})` : '#081a12'}
                  stroke={isChill ? 'rgba(56,245,176,0.28)' : 'rgba(56,245,176,.25)'}
                  strokeWidth={1}
                />
                <rect
                  x={cx - 168}
                  y={streamLabelY + 1}
                  width={336}
                  height={3}
                  rx={1.5}
                  fill="rgba(255,255,255,0.06)"
                />
                <text
                  x={cx}
                  y={streamLabelY + 19}
                  textAnchor="middle"
                  fontFamily="system-ui, sans-serif"
                  fontWeight={700}
                  fontSize={isChill ? 10 : 8.5}
                  letterSpacing={isChill ? 1.2 : 1.5}
                  fill={isChill ? '#d8f5e4' : C.WHICH_NEON.green}
                  opacity={0.95}
                >
                  {artistMarquee}
                </text>
              </g>
            )}

            <rect
              x={scrX - 10}
              y={scrY - 10}
              width={scrW + 20}
              height={scrH + 20}
              rx={10}
              fill="#000"
              stroke={isChill ? 'rgba(46,61,69,0.65)' : C.WHICH_NEON.edge}
              strokeWidth={2}
            />
            <rect
              x={scrX - 4}
              y={scrY - 4}
              width={scrW + 8}
              height={scrH + 8}
              rx={8}
              fill="none"
              stroke={C.WHICH_NEON.green}
              strokeWidth={1.5}
              opacity={isChill ? 0.55 : 0.75}
            >
              {!isChill && (
                <animate attributeName="stroke" values={`${C.WHICH_NEON.green};${C.WHICH_NEON.cyan};${C.WHICH_NEON.magenta};${C.WHICH_NEON.green}`} dur="6s" repeatCount="indefinite" />
              )}
            </rect>
            <rect x={scrX} y={scrY} width={scrW} height={scrH} rx={6} fill="#020a07" stroke="#1b2a22" strokeWidth={2} />

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
                <circle cx={cx} cy={scrY + scrH / 2} r={36} fill="none" stroke={C.WHICH_NEON.green} strokeWidth={2} opacity={0.85}>
                  <animate attributeName="r" values="32;38;32" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <polygon
                  points={`${cx + 8},${scrY + scrH / 2 - 14} ${cx + 8},${scrY + scrH / 2 + 14} ${cx + 28},${scrY + scrH / 2}`}
                  fill={C.WHICH_NEON.green}
                  opacity={0.9}
                />
              </>
            )}

            <rect x={cx - rigW / 2 + 20} y={deck - 8} width={rigW - 40} height={8} rx={2} fill="#0c1c15" stroke="rgba(56,245,176,.25)" strokeWidth={1} />
            <line
              x1={cx - rigW / 2 + 24}
              y1={deck - 4}
              x2={cx + rigW / 2 - 24}
              y2={deck - 4}
              stroke={C.WHICH_NEON.green}
              strokeWidth={2}
              strokeDasharray="4 22"
              opacity={0.75}
            >
              <animate attributeName="opacity" values="0.5;0.95;0.5" dur="3s" repeatCount="indefinite" />
            </line>

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
                fill="#bdfff0"
                opacity={0.8}
              >
                <animate attributeName="opacity" values="0;1;0" dur={`${2.3 + (i % 5) * 0.3}s`} repeatCount="indefinite" />
              </circle>
            ))}
          </g>
        </g>
      </>
    );
  }

  const WHICH_STAGE_CHANNEL = stageChannelForVenueKind('which-stage', 0);

  function CreatorStageLive() {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const { video, src, vidKey, onIframeLoad } = useStagePlayer({
      live: true,
      channel: WHICH_STAGE_CHANNEL,
      iframeRef,
    });

    const videoFoX = ox + S * (scrX - ox);
    const videoFoY = oy + S * (scrY - oy) + pushY;
    const videoFoW = scrW * S;
    const videoFoH = scrH * S;

    return (
      <>
        <CreatorStageShell idleScreen={false} />
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
            />
          </div>
        </foreignObject>
      </>
    );
  }

  function MainStage({ live = false }: { live?: boolean }) {
    if (!live) return <CreatorStageShell />;
    return <CreatorStageLive />;
  }

  return { MainStage };
}
