'use client';

import { useRef } from 'react';
import type { HTMLAttributes } from 'react';
import { useOptionalCreatorStage } from '@/lib/stages/CreatorStageContext';
import { nowPlayingStream } from '@/lib/stages/runtime';
import { streamChannelMarquee, streamTitleMarquee } from '@/lib/stages/streamLabel';
import { useStagePlayer } from '../../../useStagePlayer';
import type { StageVideo } from '@/lib/stageVideos';
import { StageVideoFrame, STAGE_VIDEO_FO_STYLE, STAGE_VIDEO_WRAPPER_STYLE } from '../../../StageVideoFrame';
import { stageChannelForRoute } from '@/lib/isolatedCity';
import type { VenueRoute } from '@/lib/venueRoutes';
import { stageChannelForVenueKind } from '@/lib/venues';
import type { UserStagePublic } from '@/lib/stages/types';
import type { CreatorStageConstants } from './types';
import { CreatorSpeakerTower } from './CreatorSpeakerTower';

type StageShellProps = {
  idleScreen?: boolean;
  artistMarquee?: string | null;
  /** Landing hero — no truss/lights; speakers and screen start at truss Y. */
  heroLayout?: boolean;
};

function artistMarqueeForPlayback(
  creator: UserStagePublic | null | undefined,
  video: StageVideo | undefined,
  isCinema: boolean,
): string | null {
  const stream = creator ? nowPlayingStream(creator) : null;
  if (stream) {
    return isCinema ? streamTitleMarquee(stream) : streamChannelMarquee(stream);
  }
  if (!video?.title?.trim()) return null;
  return streamTitleMarquee({
    url: `https://www.youtube.com/watch?v=${video.id}`,
    videoId: video.id,
    title: video.title,
    thumbnail: '',
    durationSec: video.durationSec ?? null,
  });
}

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
  const isChill = C.idPrefix === 'chill';
  const isCinema = C.idPrefix === 'cinema';
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
  const spkCabId = `${C.idPrefix}-spk-cab`;
  const spkConeId = `${C.idPrefix}-spk-cone`;

  // ---------------------------------------------------------------------------
  // Animation CSS. All keyframes are stage-prefixed to avoid cross-tile
  // collisions. Transform/opacity only — no SMIL, no paint-triggering props.
  // The rotating beams get their own compositor layers (will-change) so the
  // rotation composites instead of repainting the backdrop. Pausing: add the
  // `${P}-paused` class to the root group (e.g. from an IntersectionObserver)
  // to freeze every animation under it.
  // ---------------------------------------------------------------------------
  const P = C.idPrefix;
  const animRoot = `${P}-stageAnim`;

  const beamKeyframes = BEAMS.map(
    (b, i) =>
      `@keyframes ${P}-beam${i}{0%,100%{transform:rotate(${b.a1}deg)}50%{transform:rotate(${b.a2}deg)}}`,
  ).join('');

  const STAGE_ANIM_CSS = `
.${P}-spin{transform-box:fill-box;transform-origin:center top;will-change:transform}
.${P}-ctr{transform-box:fill-box;transform-origin:center;will-change:transform,opacity}
.${P}-paused *{animation-play-state:paused!important}
${beamKeyframes}
@keyframes ${P}-beamFade{0%,100%{opacity:.12}50%{opacity:.34}}
@keyframes ${P}-haze{0%,100%{opacity:.65}50%{opacity:1}}
@keyframes ${P}-lens{0%,100%{opacity:1}50%{opacity:.45}}
@keyframes ${P}-border{0%,100%{opacity:.55}50%{opacity:.85}}
@keyframes ${P}-screenPulse{0%,100%{transform:scale(.9);opacity:.7}50%{transform:scale(1.06);opacity:1}}
@keyframes ${P}-spkTopPulse{0%,100%{opacity:.26}50%{opacity:.96}}
@media (prefers-reduced-motion: reduce){.${animRoot} *{animation:none!important}}
`;

  function CreatorStageShell({
    idleScreen = true,
    artistMarquee: artistMarqueeProp,
    heroLayout = false,
  }: StageShellProps) {
    const deck = GND;
    const creator = useOptionalCreatorStage();
    const artistMarquee = artistMarqueeProp ?? artistMarqueeForPlayback(creator, undefined, isCinema);
    const rigTrussY = trussY;
    const heroNavGap = C.WHICH_STAGE_HERO_NAV_GAP ?? 0;
    const rigSpeakerY = heroLayout ? trussY + heroNavGap : speakerY;
    const rigScrY = heroLayout ? rigSpeakerY + 10 : scrY;
    const rigStreamLabelY = heroLayout ? rigSpeakerY - 4 : streamLabelY;

    return (
      <>
        <g className={animRoot} transform={`translate(0, ${pushY})`}>
          <g transform={`translate(${ox},${oy}) scale(${S}) translate(${-ox},${-oy})`}>
            <style>{STAGE_ANIM_CSS}</style>
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
              <linearGradient id={spkCabId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#0a120f" />
                <stop offset="45%" stopColor={isChill ? '#1e3028' : '#172820'} />
                <stop offset="100%" stopColor="#090e0c" />
              </linearGradient>
              <radialGradient id={spkConeId} cx="38%" cy="32%" r="68%">
                <stop offset="0%" stopColor="#344a40" />
                <stop offset="50%" stopColor="#141f1a" />
                <stop offset="100%" stopColor="#060a08" />
              </radialGradient>
            </defs>

            <ellipse
              cx={cx}
              cy={deck - 120}
              rx={rigW * 0.55}
              ry={140}
              fill={`url(#${hazeId})`}
              style={{ animation: `${P}-haze 7s ease-in-out infinite` }}
            />

            {[cx - 210, cx + 210].map((tx, i) => (
              <CreatorSpeakerTower
                key={`spk-${i}`}
                transform={`translate(${tx - 27},${rigSpeakerY})`}
                cabGradId={spkCabId}
                coneGradId={spkConeId}
                strokeColor={isChill ? 'rgba(46,61,69,0.55)' : 'rgba(56,245,176,.22)'}
                accentColor={C.WHICH_NEON.green}
                topPulseClass={isCinema ? `${P}-spkTopPulse` : undefined}
                topPulseAnim={isCinema ? `${P}-spkTopPulse 2.8s ease-in-out infinite` : undefined}
                topPulseDelay={isCinema ? `${i * 1.4}s` : undefined}
              />
            ))}

            {/* Light beams: no mixBlendMode (was recompositing the whole backdrop
                every frame). Rotation + fade are CSS transform/opacity now, and
                each beam is promoted to its own layer via the `${P}-spin` class. */}
            {!heroLayout &&
              BEAMS.map((b, i) => (
                <g key={i} transform={`translate(${b.x},${rigTrussY + 14})`}>
                  <polygon
                    className={`${P}-spin`}
                    points="-28,200 0,0 28,200"
                    fill={`url(#${beamId})`}
                    style={{
                      animation: `${P}-beam${i} ${b.dur}s ease-in-out infinite, ${P}-beamFade ${(b.dur * 0.65).toFixed(2)}s ease-in-out infinite`,
                    }}
                  />
                  <polygon
                    className={`${P}-spin`}
                    points="-14,200 0,0 14,200"
                    fill={b.c}
                    opacity={0.32}
                    style={{ animation: `${P}-beam${i} ${b.dur}s ease-in-out infinite` }}
                  />
                </g>
              ))}

            {isChill && !heroLayout && (
              <rect
                x={cx - rigW / 2 - 4}
                y={rigTrussY + 24}
                width={rigW + 8}
                height={6}
                rx={3}
                fill="rgba(0,0,0,0.28)"
                opacity={0.55}
              />
            )}

            {!heroLayout && (
              <>
                <rect
                  x={cx - rigW / 2}
                  y={rigTrussY}
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
                    y={rigTrussY + 1}
                    width={rigW - 4}
                    height={5}
                    rx={2}
                    fill="rgba(255,255,255,0.07)"
                  />
                )}
              </>
            )}
            {!heroLayout &&
              LENS_COLORS.map((col, i) => {
                const lx = cx - rigW / 2 + 36 + i * ((rigW - 72) / (LENS_COLORS.length - 1));
                const lensDur = (2 + i * 0.35).toFixed(2);
                return (
                  <g key={i}>
                    {isChill && (
                      <circle cx={lx} cy={rigTrussY + 11} r={9} fill="none" stroke="rgba(46,61,69,0.5)" strokeWidth={1} />
                    )}
                    {/* Static pre-blurred halo: filter runs ONCE, never re-runs while
                        animating (was the per-frame paint cost on the old lenses). */}
                    <circle cx={lx} cy={rigTrussY + 11} r={7} fill={col} filter={`url(#${glowId})`} opacity={0.5} />
                    {/* Sharp core carries the flicker via opacity only — no filter. */}
                    <circle
                      cx={lx}
                      cy={rigTrussY + 11}
                      r={7}
                      fill={col}
                      style={{ animation: `${P}-lens ${lensDur}s ease-in-out infinite` }}
                    />
                    <circle cx={lx} cy={rigTrussY + 11} r={3.5} fill="#fff" opacity={0.85} />
                  </g>
                );
              })}

            {artistMarquee && (
              <g data-stage-artist-marquee>
                <rect
                  x={cx - 172}
                  y={rigStreamLabelY}
                  width={344}
                  height={28}
                  rx={4}
                  fill={isChill ? `url(#${marqueeGradId})` : '#081a12'}
                  stroke={isChill ? 'rgba(56,245,176,0.28)' : 'rgba(56,245,176,.25)'}
                  strokeWidth={1}
                />
                <rect
                  x={cx - 168}
                  y={rigStreamLabelY + 1}
                  width={336}
                  height={3}
                  rx={1.5}
                  fill="rgba(255,255,255,0.06)"
                />
                <text
                  x={cx}
                  y={rigStreamLabelY + 19}
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
              y={rigScrY - 10}
              width={scrW + 20}
              height={scrH + 20}
              rx={10}
              fill="#000"
              stroke={isChill ? 'rgba(46,61,69,0.65)' : C.WHICH_NEON.edge}
              strokeWidth={2}
            />
            {/* Screen frame glow: was cycling `stroke` color (a paint property,
                full repaint every frame). Now a single green border with an
                opacity pulse. If you want the rainbow back without paint, stack
                cyan/magenta rects and cross-fade their opacity. */}
            <rect
              x={scrX - 4}
              y={rigScrY - 4}
              width={scrW + 8}
              height={scrH + 8}
              rx={8}
              fill="none"
              stroke={C.WHICH_NEON.green}
              strokeWidth={1.5}
              opacity={isChill ? 0.55 : undefined}
              style={!isChill ? { animation: `${P}-border 6s ease-in-out infinite` } : undefined}
            />
            <rect x={scrX} y={rigScrY} width={scrW} height={scrH} rx={6} fill="#020a07" stroke="#1b2a22" strokeWidth={2} />

            {idleScreen && (
              <>
                <rect
                  x={scrX + 4}
                  y={rigScrY + 4}
                  width={scrW - 8}
                  height={scrH - 8}
                  rx={4}
                  fill="#04100b"
                />
                {Array.from({ length: 7 }, (_, i) => (
                  <rect
                    key={i}
                    x={scrX + 8}
                    y={rigScrY + 10 + i * 26}
                    width={scrW - 16}
                    height={2}
                    fill="rgba(255,255,255,.08)"
                  />
                ))}
                {/* Idle play ring: was animating `r` (geometry → repaint). Now a
                    transform scale + opacity pulse around the circle's center. */}
                <circle
                  className={`${P}-ctr`}
                  cx={cx}
                  cy={rigScrY + scrH / 2}
                  r={36}
                  fill="none"
                  stroke={C.WHICH_NEON.green}
                  strokeWidth={2}
                  style={{ animation: `${P}-screenPulse 2.4s ease-in-out infinite` }}
                />
                <polygon
                  points={`${cx + 8},${rigScrY + scrH / 2 - 14} ${cx + 8},${rigScrY + scrH / 2 + 14} ${cx + 28},${rigScrY + scrH / 2}`}
                  fill={C.WHICH_NEON.green}
                  opacity={0.9}
                />
              </>
            )}

          </g>
        </g>
      </>
    );
  }

  const DEFAULT_PLAYBACK_CHANNEL = stageChannelForVenueKind('which-stage', 0);

  function CreatorStageLive({ playbackRoute }: { playbackRoute?: VenueRoute }) {
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const creator = useOptionalCreatorStage();
    const channel = playbackRoute ? stageChannelForRoute(playbackRoute) : DEFAULT_PLAYBACK_CHANNEL;
    const { video, src, vidKey, onIframeLoad } = useStagePlayer({
      live: true,
      channel,
      iframeRef,
    });
    const artistMarquee = artistMarqueeForPlayback(creator, video, isCinema);

    const videoFoX = ox + S * (scrX - ox);
    const videoFoY = oy + S * (scrY - oy) + pushY;
    const videoFoW = scrW * S;
    const videoFoH = scrH * S;

    return (
      <>
        <CreatorStageShell idleScreen={false} artistMarquee={artistMarquee} />
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

  function MainStage({
    live = false,
    playbackRoute,
    heroScreen = false,
  }: {
    live?: boolean;
    playbackRoute?: VenueRoute;
    /** Empty stage screen for landing hero copy (no video, no idle play UI). */
    heroScreen?: boolean;
  }) {
    if (heroScreen) {
      return <CreatorStageShell idleScreen={false} artistMarquee={null} heroLayout />;
    }
    if (!live) return <CreatorStageShell />;
    return <CreatorStageLive playbackRoute={playbackRoute} />;
  }

  return { MainStage };
}