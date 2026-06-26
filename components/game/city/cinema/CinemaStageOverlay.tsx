'use client';

import { memo, useRef, useSyncExternalStore } from 'react';
import { stageChannelForRoute } from '@/lib/isolatedCity';
import { isMobileStaticViewport } from '@/lib/staticCityViewport';
import type { VenueRoute } from '@/lib/venueRoutes';
import { useStagePlayer } from '../../useStagePlayer';
import { StageVideoFrame, STAGE_VIDEO_WRAPPER_STYLE } from '../../StageVideoFrame';
import { WHICH_STAGE_MID_X, WHICH_STAGE_SCALE } from './constants';
import { getCinemaVideoScreenRect } from './cinemaStageLayout';

const SVG_VB_W = 1400;
const SVG_VB_H = 900;
const SVG_CENTER_Y = SVG_VB_H / 2;

const HIDDEN_STYLE: React.CSSProperties = { display: 'none' };
let _cachedStyle: React.CSSProperties = HIDDEN_STYLE;
let _cachedVw = -1;
let _cachedVh = -1;

function computeOverlayStyle(): React.CSSProperties {
  if (typeof window === 'undefined') return HIDDEN_STYLE;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (vw === _cachedVw && vh === _cachedVh) return _cachedStyle;
  _cachedVw = vw;
  _cachedVh = vh;

  const svgScale = Math.max(vw / SVG_VB_W, vh / SVG_VB_H);
  const screen = getCinemaVideoScreenRect(WHICH_STAGE_MID_X, WHICH_STAGE_SCALE);
  const top = vh / 2 + (screen.y - SVG_CENTER_Y) * svgScale;

  _cachedStyle = {
    position: 'absolute',
    left: '50%',
    top: `${top}px`,
    transform: `translateX(-50%) scale(${svgScale})`,
    transformOrigin: '50% 0%',
    width: screen.width,
    height: screen.height,
    zIndex: 5,
    pointerEvents: 'auto',
  };
  return _cachedStyle;
}

function subscribeResize(cb: () => void) {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
}

function getMobile() {
  return isMobileStaticViewport();
}

function getMobileServer() {
  return false;
}

type Props = {
  live: boolean;
  playbackRoute: VenueRoute;
};

export const CinemaStageOverlay = memo(function CinemaStageOverlay({
  live,
  playbackRoute,
}: Props) {
  const style = useSyncExternalStore(
    subscribeResize,
    computeOverlayStyle,
    () => HIDDEN_STYLE,
  );
  const mobile = useSyncExternalStore(subscribeResize, getMobile, getMobileServer);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const channel = stageChannelForRoute(playbackRoute);
  const screen = getCinemaVideoScreenRect(WHICH_STAGE_MID_X, WHICH_STAGE_SCALE);
  const { video, src, vidKey, onIframeLoad } = useStagePlayer({
    live,
    channel,
    iframeRef,
  });

  if (mobile || !live) return null;

  return (
    <div style={style} aria-hidden={!src}>
      <div style={{ width: '100%', height: '100%', ...STAGE_VIDEO_WRAPPER_STYLE }}>
        <StageVideoFrame
          iframeRef={iframeRef}
          src={src}
          vidKey={vidKey}
          title={video?.title}
          onIframeLoad={onIframeLoad}
          width="100%"
          height="100%"
          borderRadius={screen.borderRadius}
          loading="eager"
        />
      </div>
    </div>
  );
});
