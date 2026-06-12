'use client';

import { useRef, type ReactNode } from 'react';
import { setDeepSpaceNowPlaying } from '@/lib/deepSpaceNow';
import { minStageScale } from '@/lib/stageViewport';
import { useStagePlayer } from './useStagePlayer';
import { StageVideoFrame } from './StageVideoFrame';

const IFRAME_W = 540;
const IFRAME_H = 304;
const STAGE_W = 620;

/** Static facade styles — no continuous CSS animations (Deep Space perf). */
const S = `
  .ds-wrap {
    display: flex; flex-direction: column; align-items: center; gap: 0;
    position: relative; z-index: 1;
    font-family: 'Dosis', system-ui, sans-serif;
    filter: drop-shadow(0 20px 48px rgba(0,0,0,.55));
  }

  .ds-halo {
    position: absolute; top: 36px; left: 50%; transform: translateX(-50%);
    width: 460px; height: 460px; border-radius: 50%;
    background: radial-gradient(circle, rgba(125,240,221,.12) 0%, transparent 68%);
    pointer-events: none;
  }

  .ds-pylons {
    width: ${STAGE_W + 48}px; height: 0; position: relative;
    pointer-events: none;
  }
  .ds-pylon {
    position: absolute; bottom: -2px; width: 14px; height: 72px;
    background: linear-gradient(180deg, rgba(125,240,221,.08) 0%, rgba(54,224,200,.22) 40%, rgba(36,23,64,.9) 100%);
    border: 1px solid rgba(125,240,221,.22);
    border-radius: 3px 3px 0 0;
  }
  .ds-pylon::after {
    content: ''; position: absolute; top: 6px; left: 50%; transform: translateX(-50%);
    width: 4px; height: 4px; border-radius: 50%;
    background: #7df0dd; box-shadow: 0 0 6px rgba(125,240,221,.8);
  }
  .ds-pylon--l { left: 0; }
  .ds-pylon--r { right: 0; }

  .ds-sign {
    width: ${STAGE_W}px; min-height: 54px;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 10px 52px 8px;
    box-sizing: border-box;
    background:
      linear-gradient(180deg, rgba(48,32,82,.95) 0%, rgba(28,18,52,.92) 100%);
    border: 1px solid rgba(125,240,221,.32);
    border-bottom: 1px solid rgba(125,240,221,.14);
    border-radius: 14px 14px 0 0;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,.06),
      0 0 32px rgba(54,224,200,.12);
    position: relative; overflow: hidden;
  }
  .ds-sign::before, .ds-sign::after {
    content: '✦'; position: absolute; top: 50%; transform: translateY(-50%);
    color: rgba(255,203,57,.55); font-size: 11px;
    text-shadow: 0 0 8px rgba(255,203,57,.4);
  }
  .ds-sign::before { left: 18px; }
  .ds-sign::after { right: 18px; }

  .ds-title {
    font-size: 24px; letter-spacing: 11px; font-weight: 500;
    color: #7df0dd;
    text-shadow: 0 0 14px rgba(125,240,221,.65), 0 0 32px rgba(54,224,200,.35);
  }
  .ds-sub {
    font-size: 9px; letter-spacing: 1.5px; font-weight: 400;
    color: rgba(232,230,255,.72); margin-top: 5px;
    line-height: 1.3; max-width: ${STAGE_W - 80}px;
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  }

  .ds-orbit-strip {
    width: ${STAGE_W}px; height: 14px; position: relative; overflow: hidden;
    background: linear-gradient(90deg, #1a1430, #241b40 20%, #2a2048 50%, #241b40 80%, #1a1430);
    border-left: 1px solid rgba(125,240,221,.18);
    border-right: 1px solid rgba(125,240,221,.18);
  }
  .ds-orbit-strip::before {
    content: ''; position: absolute; inset: 0;
    background: repeating-linear-gradient(
      90deg,
      transparent 0 14px,
      rgba(125,240,221,.06) 14px 15px
    );
  }

  .ds-body {
    width: ${STAGE_W}px;
    padding: 16px 0 14px;
    background:
      linear-gradient(180deg, rgba(22,14,40,.94) 0%, rgba(14,10,28,.98) 100%);
    border-left: 1px solid rgba(125,240,221,.24);
    border-right: 1px solid rgba(125,240,221,.24);
    display: flex; flex-direction: column; align-items: center;
    position: relative;
  }
  .ds-body::before, .ds-body::after {
    content: ''; position: absolute;
    width: 14px; height: 14px;
    border-color: rgba(125,240,221,.45); border-style: solid;
    top: 10px;
  }
  .ds-body::before { left: 12px; border-width: 2px 0 0 2px; }
  .ds-body::after  { right: 12px; border-width: 2px 2px 0 0; }

  .ds-bezel {
    padding: 6px;
    background: linear-gradient(145deg, rgba(54,224,200,.12), rgba(36,23,64,.6));
    border: 1px solid rgba(125,240,221,.35);
    border-radius: 8px;
    box-shadow:
      0 0 0 1px rgba(8,6,18,.8),
      0 0 24px rgba(54,224,200,.15),
      inset 0 0 20px rgba(54,224,200,.06);
  }

  .ds-screen {
    width: ${IFRAME_W}px; position: relative;
    border: 2px solid rgba(125,240,221,.5);
    border-radius: 4px;
    box-shadow:
      inset 0 0 32px rgba(54,224,200,.1),
      0 0 40px rgba(54,224,200,.18);
    background: #030508;
    overflow: hidden;
  }
  .ds-screen::before {
    content: ''; position: absolute; inset: 0; pointer-events: none; z-index: 2;
    background: linear-gradient(135deg, rgba(255,255,255,.07) 0%, transparent 38%);
  }

  .ds-iframe {
    display: block; width: 100%;
    aspect-ratio: 16/9; border: none; background: #030508;
  }

  .ds-deck {
    width: ${STAGE_W}px; height: 20px;
    display: flex; align-items: center; justify-content: center; gap: 10px;
    background: linear-gradient(180deg, #1e1638, #161028);
    border-left: 1px solid rgba(125,240,221,.16);
    border-right: 1px solid rgba(125,240,221,.16);
    border-top: 1px solid rgba(125,240,221,.1);
  }
  .ds-star {
    width: 5px; height: 5px; border-radius: 50%;
    background: #7df0dd;
    box-shadow: 0 0 5px rgba(125,240,221,.6);
  }
  .ds-star:nth-child(2) { background: #ffcb39; box-shadow: 0 0 5px rgba(255,203,57,.5); }
  .ds-star:nth-child(4) { background: #ffcb39; box-shadow: 0 0 5px rgba(255,203,57,.5); }

  .ds-base {
    width: ${STAGE_W}px; height: 30px;
    background: linear-gradient(180deg, #2a2048 0%, #1a1430 55%, #120e22 100%);
    border: 1px solid rgba(125,240,221,.18);
    border-top: none;
    border-radius: 0 0 16px 16px;
    position: relative; overflow: hidden;
  }
  .ds-base::before {
    content: ''; position: absolute; top: 0; left: 8%; right: 8%; height: 2px;
    background: linear-gradient(90deg,
      transparent, rgba(125,240,221,.35) 25%, rgba(255,203,57,.45) 50%,
      rgba(125,240,221,.35) 75%, transparent);
  }
  .ds-base::after {
    content: ''; position: absolute; inset: 0;
    background: radial-gradient(ellipse 75% 120% at 50% 0%, rgba(54,224,200,.16), transparent 70%);
  }

  .ds-glow {
    position: absolute; bottom: -12px; width: ${STAGE_W}px; height: 48px;
    background: radial-gradient(ellipse 78% 100% at 50% 0%, rgba(54,224,200,.22) 0%, transparent 72%);
    pointer-events: none;
  }
`;

function DeepSpaceView({
  screen,
  videoTitle,
  titleKey = 'idle',
}: {
  screen: ReactNode;
  videoTitle: string;
  titleKey?: string | number;
}) {
  return (
    <div className="ds-wrap">
      <style>{S}</style>
      <div className="ds-halo" aria-hidden />
      <div className="ds-pylons" aria-hidden>
        <div className="ds-pylon ds-pylon--l" />
        <div className="ds-pylon ds-pylon--r" />
      </div>
      <div className="ds-sign">
        <div className="ds-title">DEEP SPACE</div>
        <div key={titleKey} className="ds-sub">{videoTitle}</div>
      </div>
      <div className="ds-orbit-strip" aria-hidden />
      <div className="ds-body">
        <div className="ds-bezel">
          <div className="ds-screen">{screen}</div>
        </div>
      </div>
      <div className="ds-deck" aria-hidden>
        <span className="ds-star" />
        <span className="ds-star" />
        <span className="ds-star" />
        <span className="ds-star" />
        <span className="ds-star" />
      </div>
      <div className="ds-base" />
      <div className="ds-glow" aria-hidden />
    </div>
  );
}

/** Static facade — no YouTube player or hooks. */
export function DeepSpaceShell() {
  return (
    <DeepSpaceView
      videoTitle="Cosmic Drift"
      screen={
        <div
          className="ds-iframe"
          style={{ width: IFRAME_W, height: IFRAME_H, background: '#030508' }}
        />
      }
    />
  );
}

function DeepSpaceLive() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { video, src, vidKey, onIframeLoad } = useStagePlayer({
    live: true,
    channel: 'deep-space',
    iframeRef,
    onNowPlaying: setDeepSpaceNowPlaying,
  });

  const videoTitle = video?.title ?? 'Loading…';

  return (
    <DeepSpaceView
      titleKey={vidKey}
      videoTitle={videoTitle}
      screen={
        video && src ? (
          <StageVideoFrame
            iframeRef={iframeRef}
            src={src}
            vidKey={vidKey}
            title={video.title}
            onIframeLoad={onIframeLoad}
            width={IFRAME_W}
            height={IFRAME_H}
          />
        ) : (
          <div
            className="ds-iframe"
            style={{ width: IFRAME_W, height: IFRAME_H, background: '#030508' }}
          />
        )
      }
    />
  );
}

export default function DeepSpaceStage({ live = true }: { live?: boolean }) {
  if (!live) return <DeepSpaceShell />;
  return <DeepSpaceLive />;
}

export const DEEP_SPACE_WIDTH = STAGE_W;
export const DEEP_SPACE_SCALE = minStageScale(1.32);
/** ds-wrap total height at scale 1 */
export const DEEP_SPACE_HEIGHT = 452;
