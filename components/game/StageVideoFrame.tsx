'use client';

import type { CSSProperties, RefObject } from 'react';
import { STAGE_IFRAME_STYLE } from './useStagePlayer';

/** Minimal permissions — autoplay only; no PiP or fullscreen. */
export const STAGE_IFRAME_ALLOW = 'autoplay; encrypted-media';

type StageVideoFrameProps = {
  iframeRef: RefObject<HTMLIFrameElement | null>;
  src: string;
  vidKey: number;
  title?: string;
  onIframeLoad: () => void;
  playerVisible: boolean;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  loading?: 'eager' | 'lazy';
};

/**
 * Muted-autoplay YouTube embed with a loading veil and a permanent transparent
 * shield so users cannot click into the iframe (controls, pause, YouTube UI).
 */
export function StageVideoFrame({
  iframeRef,
  src,
  vidKey,
  title,
  onIframeLoad,
  playerVisible,
  width = '100%',
  height = '100%',
  borderRadius = 0,
  loading = 'eager',
}: StageVideoFrameProps) {
  const hostStyle: CSSProperties = {
    width,
    height,
    background: '#000',
    borderRadius,
    position: 'relative',
    overflow: 'hidden',
  };

  if (!src) return <div style={hostStyle} />;

  return (
    <div style={hostStyle}>
      <iframe
        key={vidKey}
        ref={iframeRef}
        data-stage-embed
        src={src}
        title={title ?? 'Live stage'}
        loading={loading}
        onLoad={onIframeLoad}
        allow={STAGE_IFRAME_ALLOW}
        tabIndex={-1}
        style={{ ...STAGE_IFRAME_STYLE, width: '100%', height: '100%' }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 10,
          background: 'rgba(0,0,0,0.93)',
          pointerEvents: playerVisible ? 'none' : 'auto',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 5,
          opacity: playerVisible ? 0 : 1,
          transition: playerVisible ? 'opacity 0.8s' : 'none',
        }}
        data-stage-video-veil
      >
        <span
          style={{
            fontFamily: 'sans-serif',
            fontSize: 9,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.45)',
          }}
        >
          ▶ now playing
        </span>
        {title && (
          <span
            style={{
              fontFamily: 'sans-serif',
              fontSize: 11,
              color: 'rgba(255,255,255,0.8)',
              textAlign: 'center',
              padding: '0 10px',
              lineHeight: 1.3,
            }}
          >
            {title}
          </span>
        )}
      </div>
      <div
        aria-hidden
        tabIndex={-1}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 11,
          pointerEvents: 'auto',
          background: 'transparent',
        }}
      />
    </div>
  );
}
