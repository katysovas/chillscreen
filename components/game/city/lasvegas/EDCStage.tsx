'use client';

import { useRef } from 'react';
import type { HTMLAttributes } from 'react';
import { EDC_STAGE_MID_X, EDC_STAGE_PUSH_Y, EDC_STAGE_SCALE, EDC_STAGE_HALF, NEON, VEGAS_GND } from './constants';
import { Flame, laserFan } from './helpers';
import { setEdcNowPlaying } from '@/lib/edcNowPlaying';
import { useStagePlayer } from '../../useStagePlayer';
import { StageVideoFrame } from '../../StageVideoFrame';
import { StageToiletsBeside } from '../street/StageToiletRow';

export { EDC_STAGE_MID_X };

const GND = VEGAS_GND;

type EDCStageShellProps = {
  marquee?: string;
  /** Animated color wash on the LED wall when no video is mounted. */
  idleScreen?: boolean;
};

/** Static owl megastage geometry — no YouTube hooks. */
function EDCStageShell({ marquee = 'ELECTRIC DAZE', idleScreen = true }: EDCStageShellProps) {
  const cx = EDC_STAGE_MID_X;
  const stageY = GND;
  const scrW = 440;
  const scrH = 248;
  const scrX = cx - scrW / 2;
  const scrY = 404;
  const owlEyeY = 366;
  const deckY = 648;
  const S = EDC_STAGE_SCALE;
  const pushY = EDC_STAGE_PUSH_Y;
  const ox = cx;
  const oy = stageY;

  return (
    <>
      <g transform={`translate(0, ${pushY})`}>
        <g transform={`translate(${ox},${oy}) scale(${S}) translate(${-ox},${-oy})`}>
          {laserFan(cx, 250, 9, 560, NEON.violet, 96)}

          {[275, 225, 175, 125].map((rr, i) => {
            const col = [NEON.violet, NEON.pink, NEON.cyan, NEON.gold][i];
            return (
              <path
                key={i}
                d={`M${cx - rr - 55},${stageY} Q${cx - rr - 55},${stageY - rr * 1.3} ${cx},${stageY - rr * 1.35}
                    Q${cx + rr + 55},${stageY - rr * 1.3} ${cx + rr + 55},${stageY}`}
                fill="none"
                stroke={col}
                strokeWidth={9}
                opacity={0.55}
              >
                <animate
                  attributeName="opacity"
                  values="0.25;0.8;0.25"
                  dur={`${3 + i}s`}
                  begin={`${i * 0.5}s`}
                  repeatCount="indefinite"
                />
              </path>
            );
          })}

          {[-120, 120].map((dx, i) => (
            <g key={i}>
              <circle cx={cx + dx} cy={owlEyeY} r={40} fill="#0c0a16" stroke={NEON.gold} strokeWidth={4} />
              <circle cx={cx + dx} cy={owlEyeY} r={22} fill={NEON.gold}>
                <animate
                  attributeName="fill"
                  values={`${NEON.gold};${NEON.cyan};${NEON.pink};${NEON.gold}`}
                  dur="7s"
                  begin={`${i}s`}
                  repeatCount="indefinite"
                />
                <animate attributeName="r" values="18;24;18" dur="3s" begin={`${i * 0.5}s`} repeatCount="indefinite" />
              </circle>
            </g>
          ))}

          <rect x={scrX - 10} y={scrY - 10} width={scrW + 20} height={scrH + 20} rx={10} fill="#0c0a16" stroke="#2a2440" strokeWidth={3} />
          <rect x={scrX - 4} y={scrY - 4} width={scrW + 8} height={scrH + 8} rx={8} fill="none" stroke={NEON.cyan} strokeWidth={2} opacity={0.7}>
            <animate
              attributeName="stroke"
              values={`${NEON.cyan};${NEON.pink};${NEON.lime};${NEON.violet};${NEON.cyan}`}
              dur="6s"
              repeatCount="indefinite"
            />
          </rect>
          {idleScreen && (
            <rect x={scrX} y={scrY} width={scrW} height={scrH} rx={6} fill={NEON.pink} opacity={0.35}>
              <animate
                attributeName="fill"
                values={`${NEON.pink};${NEON.cyan};${NEON.lime};${NEON.violet};${NEON.pink}`}
                dur="6s"
                repeatCount="indefinite"
              />
            </rect>
          )}

          <rect x={cx - 260} y={deckY} width={520} height={stageY - deckY} fill="#15101f" />
          <rect x={cx - 260} y={deckY} width={520} height={4} fill="#2a2238" />

          {[-220, -150, -80, 80, 150, 220].map((dx, i) => (
            <Flame key={i} x={cx + dx} y={deckY} h={84} delay={i * 0.25} />
          ))}

          <path
            d={`M${cx - 380},${GND} Q${cx - 190},${GND - 34} ${cx},${GND - 26}
                Q${cx + 190},${GND - 34} ${cx + 380},${GND} Z`}
            fill="#05040a"
          />
          {Array.from({ length: 86 }, (_, i) => {
            const px = cx - 370 + ((i * 8.6) % 740);
            const py = GND - 6 - ((i * 37) % 24);
            const col = [NEON.cyan, NEON.pink, NEON.gold, NEON.lime, '#fff'][i % 5];
            return (
              <circle key={i} cx={px} cy={py} r={1.7} fill={col}>
                <animate
                  attributeName="opacity"
                  values="0.2;1;0.2"
                  dur={`${1.5 + (i % 5) * 0.4}s`}
                  begin={`${(i % 8) * 0.2}s`}
                  repeatCount="indefinite"
                />
              </circle>
            );
          })}

          <text
            x={cx}
            y={290}
            textAnchor="middle"
            fontSize={30}
            fontWeight={800}
            fill={NEON.cyan}
            fontFamily="'Arial Black', sans-serif"
            letterSpacing={3}
          >
            ELECTRIC DAZE
            <animate attributeName="fill" values={`${NEON.cyan};${NEON.pink};${NEON.cyan}`} dur="4s" repeatCount="indefinite" />
          </text>

          <rect x={cx - 110} y={GND + 30} width={220} height={20} rx={3} fill="#15101c" stroke="rgba(0,229,255,.4)" strokeWidth={1} />
          <text
            x={cx}
            y={GND + 44}
            textAnchor="middle"
            fontFamily="system-ui, sans-serif"
            fontWeight={700}
            fontSize={10}
            letterSpacing={2}
            fill="rgba(0,229,255,.85)"
          >
            {marquee.toUpperCase().slice(0, 30)}
          </text>
        </g>
        <StageToiletsBeside
          centerX={cx}
          stageHalfWidth={EDC_STAGE_HALF}
          side="right"
          y={deckY - 66}
        />
      </g>
    </>
  );
}

/** Live EDC — shell + synchronized YouTube player. */
function EDCStageLive() {
  const cx = EDC_STAGE_MID_X;
  const stageY = GND;
  const scrW = 440;
  const scrH = 248;
  const scrX = cx - scrW / 2;
  const scrY = 404;
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { video, src, vidKey, onIframeLoad, playerVisible } = useStagePlayer({
    live: true,
    channel: 'edc',
    iframeRef,
    onNowPlaying: setEdcNowPlaying,
  });

  const S = EDC_STAGE_SCALE;
  const pushY = EDC_STAGE_PUSH_Y;
  const ox = cx;
  const oy = stageY;
  const videoFoX = ox + S * (scrX - ox);
  const videoFoY = oy + S * (scrY - oy) + pushY;
  const videoFoW = scrW * S;
  const videoFoH = scrH * S;
  const marquee = video?.title ?? 'LOADING…';

  return (
    <>
      <EDCStageShell marquee={marquee} idleScreen={false} />
      <foreignObject x={videoFoX} y={videoFoY} width={videoFoW} height={videoFoH} style={{ overflow: 'visible' }}>
        <div
          {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as HTMLAttributes<HTMLDivElement>)}
          style={{
            width: scrW,
            transform: `scale(${S})`,
            transformOrigin: 'top left',
            pointerEvents: 'none',
          }}
        >
          <StageVideoFrame
            iframeRef={iframeRef}
            src={src}
            vidKey={vidKey}
            title={video?.title}
            onIframeLoad={onIframeLoad}
            playerVisible={playerVisible}
            width={scrW}
            height={scrH}
            borderRadius={6}
          />
        </div>
      </foreignObject>
    </>
  );
}

/** EDC "Electric Daze" kineticFIELD-style owl megastage with synchronized YouTube when live. */
export function EDCStage({ live = false }: { live?: boolean }) {
  if (!live) return <EDCStageShell />;
  return <EDCStageLive />;
}
