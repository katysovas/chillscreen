'use client';

import { useRef } from 'react';
import type { HTMLAttributes } from 'react';
import {
  TENTAROO_GND,
  WHICH_STAGE_MID_X,
} from '../chill/constants';
import { EDC_STAGE_PUSH_Y } from '../lasvegas/constants';
import { minStageScale } from '@/lib/stageViewport';
import { useStagePlayer } from '../../useStagePlayer';
import { StageVideoFrame, STAGE_VIDEO_FO_STYLE, STAGE_VIDEO_WRAPPER_STYLE } from '../../StageVideoFrame';

const MID_X = WHICH_STAGE_MID_X;
const GND = TENTAROO_GND;
const SCR_W = 440;
const SCR_H = 248;
const SCALE = minStageScale(1.5);
const PUSH_Y = EDC_STAGE_PUSH_Y;
const SCR_Y = 320;

export const HEADLINER_SCREEN_HALF = Math.ceil((SCR_W * SCALE) / 2) + 40;

function HeadlinerStageShell({ children }: { children?: React.ReactNode }) {
  const cx = MID_X;
  const ox = cx;
  const oy = GND;
  const scrX = cx - SCR_W / 2;

  return (
    <g transform={`translate(0, ${PUSH_Y})`}>
      <g transform={`translate(${ox},${oy}) scale(${SCALE}) translate(${-ox},${-oy})`}>
        <rect
          x={scrX - 3}
          y={SCR_Y - 3}
          width={SCR_W + 6}
          height={SCR_H + 6}
          rx={8}
          fill="#121318"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth={2}
        />
        {children}
      </g>
    </g>
  );
}

function HeadlinerVideoScreenLive() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const { video, src, vidKey, onIframeLoad } = useStagePlayer({
    live: true,
    channel: 'headliner',
    iframeRef,
  });
  const scrX = MID_X - SCR_W / 2;

  return (
    <HeadlinerStageShell>
      <foreignObject
        x={scrX}
        y={SCR_Y}
        width={SCR_W}
        height={SCR_H}
        data-stage-video-fo
        style={STAGE_VIDEO_FO_STYLE}
      >
        <div
          {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as HTMLAttributes<HTMLDivElement>)}
          style={{
            width: SCR_W,
            height: SCR_H,
            ...STAGE_VIDEO_WRAPPER_STYLE,
          }}
        >
          <StageVideoFrame
            iframeRef={iframeRef}
            src={src}
            vidKey={vidKey}
            title={video?.title}
            onIframeLoad={onIframeLoad}
            width={SCR_W}
            height={SCR_H}
            borderRadius={6}
          />
        </div>
      </foreignObject>
    </HeadlinerStageShell>
  );
}

export function HeadlinerVideoScreen({ live = false }: { live?: boolean }) {
  if (!live) return <HeadlinerStageShell />;
  return <HeadlinerVideoScreenLive />;
}
