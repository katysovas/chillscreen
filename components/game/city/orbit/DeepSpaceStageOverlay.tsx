'use client';

import { useSyncExternalStore, memo } from 'react';
import DeepSpaceStage, { DeepSpaceShell } from '../../DeepSpaceStage';
import { STAGE_VIDEO_WRAPPER_STYLE } from '../../StageVideoFrame';
import {
  DEEP_SPACE_HEIGHT,
  DEEP_SPACE_SCALE,
  DEEP_SPACE_STAGE_LIFT_Y,
  DEEP_SPACE_VIDEO_HEIGHT,
  DEEP_SPACE_WIDTH,
} from '@/lib/stageVideoLayout';
import { STAGE_ANCHOR_Y } from '@/lib/stageLayout';
import { isMobileStaticViewport } from '@/lib/staticCityViewport';

/**
 * The SVG viewport maps 1400×900 world units onto the screen via
 * `xMidYMid slice`. For a width-constrained viewport the uniform scale is
 * vw / 1400 and the SVG y-center (450 units) lands at the viewport y-center.
 *
 * The Deep Space stage top sits at SVG y = STAGE_ANCHOR_Y − deepSpaceFoH − DEEP_SPACE_STAGE_LIFT_Y
 * which evaluates to ≈ 8.24 — very close to the top of the 900-unit canvas.
 * Its distance below the SVG y-center is therefore: 450 − 8.24 = 441.76 units.
 *
 * These constants encode that geometry for the CSS position calculation below.
 */
const SVG_VB_W = 1400;
const SVG_VB_H = 900;
const SVG_CENTER_Y = SVG_VB_H / 2; // 450

function getStageTopInSvg(): number {
  const foH = DEEP_SPACE_HEIGHT * DEEP_SPACE_SCALE;
  return STAGE_ANCHOR_Y - foH - DEEP_SPACE_STAGE_LIFT_Y;
}

// Module-level cache so getSnapshot returns the same object reference when the
// viewport hasn't changed. useSyncExternalStore uses Object.is to detect
// changes — returning a new object every call causes an infinite render loop.
const HIDDEN_STYLE: React.CSSProperties = { display: 'none' };
let _cachedStyle: React.CSSProperties = HIDDEN_STYLE;
let _cachedVw = -1;
let _cachedVh = -1;

function computeOverlayStyle(): React.CSSProperties {
  if (typeof window === 'undefined') return HIDDEN_STYLE;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  // Return same reference when viewport is unchanged (required by useSyncExternalStore).
  if (vw === _cachedVw && vh === _cachedVh) return _cachedStyle;
  _cachedVw = vw;
  _cachedVh = vh;

  // Match the SVG `xMidYMid slice` scale.
  const scale = Math.max(vw / SVG_VB_W, vh / SVG_VB_H);
  // Stage top y in the SVG coordinate space (≈ 8.24).
  const stageTopSvg = getStageTopInSvg();
  // CSS top: SVG center maps to viewport mid-y; stage top is above that.
  const top = vh / 2 - (SVG_CENTER_Y - stageTopSvg) * scale;

  _cachedStyle = {
    position: 'absolute',
    left: '50%',
    top: `${top}px`,
    // translateX(-50%) centers the element; scale() enlarges it uniformly
    // from the top-center pivot so the top position stays fixed.
    transform: `translateX(-50%) scale(${scale})`,
    transformOrigin: '50% 0%',
    // Natural (un-scaled) pixel dimensions matching the SVG foreignObject.
    width: DEEP_SPACE_WIDTH * DEEP_SPACE_SCALE,
    height: DEEP_SPACE_HEIGHT * DEEP_SPACE_SCALE,
    zIndex: 3,
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
};

export const DeepSpaceStageOverlay = memo(function DeepSpaceStageOverlay({ live }: Props) {
  const style = useSyncExternalStore(
    subscribeResize,
    computeOverlayStyle,
    () => HIDDEN_STYLE,
  );

  const mobile = useSyncExternalStore(subscribeResize, getMobile, getMobileServer);

  // Mobile uses its own layout (vote strip at bottom, stage via SVG).
  // This overlay is for desktop only.
  if (mobile) return null;

  return (
    <div style={style} aria-hidden={!live}>
      <div
        style={{
          width: DEEP_SPACE_WIDTH,
          height: live ? DEEP_SPACE_HEIGHT : DEEP_SPACE_VIDEO_HEIGHT,
          transform: `scale(${DEEP_SPACE_SCALE})`,
          transformOrigin: 'top left',
          ...(live ? STAGE_VIDEO_WRAPPER_STYLE : { pointerEvents: 'none' }),
        }}
      >
        {live
          ? <DeepSpaceStage live embedVoteStrip />
          : <DeepSpaceShell />
        }
      </div>
    </div>
  );
});
