'use client';

import type { CSSProperties, RefObject } from 'react';
import { STAGE_IFRAME_STYLE } from './useStagePlayer';

/** Minimal permissions — autoplay only; no PiP or fullscreen. */
export const STAGE_IFRAME_ALLOW = 'autoplay; encrypted-media';

/** foreignObject + wrapper styles — pierce decorative SVG pointer-events: none. */
export const STAGE_VIDEO_FO_STYLE: CSSProperties = {
  overflow: 'visible',
  pointerEvents: 'auto',
  touchAction: 'manipulation',
  willChange: 'transform',
};

export const STAGE_VIDEO_WRAPPER_STYLE: CSSProperties = {
  pointerEvents: 'auto',
  touchAction: 'manipulation',
  willChange: 'transform',
  isolation: 'isolate',
};

type StageVideoFrameProps = {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  src: string;
  vidKey: number;
  title?: string;
  onIframeLoad: () => void;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  loading?: 'eager' | 'lazy';
};

/** Muted-autoplay YouTube embed — iframe receives pointer events for title-bar / logo links. */
export function StageVideoFrame({
  iframeRef,
  src,
  vidKey,
  title,
  onIframeLoad,
  width = '100%',
  height = '100%',
  borderRadius = 0,
  loading = 'lazy',
}: StageVideoFrameProps) {
  const hostStyle: CSSProperties = {
    width,
    height,
    background: '#000',
    borderRadius,
    position: 'relative',
    overflow: 'hidden',
    pointerEvents: 'auto',
    touchAction: 'manipulation',
    willChange: 'transform',
    isolation: 'isolate',
  };

  if (!src) return <div style={hostStyle} />;

  return (
    <div style={hostStyle} data-stage-video-host>
      <iframe
        key={vidKey}
        ref={iframeRef}
        data-stage-embed
        src={src}
        title={title ?? 'Live stage'}
        loading={loading}
        onLoad={onIframeLoad}
        allow={STAGE_IFRAME_ALLOW}
        style={{ ...STAGE_IFRAME_STYLE, width: '100%', height: '100%' }}
      />
    </div>
  );
}
