'use client';

import { useSyncExternalStore, type HTMLAttributes } from 'react';
import DeepSpaceStage, { DeepSpaceShell } from '../../DeepSpaceStage';
import {
  DEEP_SPACE_HEIGHT,
  DEEP_SPACE_SCALE,
  DEEP_SPACE_STAGE_LIFT_Y,
  DEEP_SPACE_VIDEO_HEIGHT,
  DEEP_SPACE_WIDTH,
} from '@/lib/stageVideoLayout';
import { STAGE_VIDEO_FO_STYLE, STAGE_VIDEO_WRAPPER_STYLE } from '../../StageVideoFrame';
import { deepSpaceMidX } from '@/lib/venues';
import type { VenueRoute } from '@/lib/venueRoutes';
import { isVenueLive } from '@/lib/venueRoutes';
import { STAGE_ANCHOR_Y } from '@/lib/stageLayout';
import { isMobileStaticViewport } from '@/lib/staticCityViewport';
import type { VenueFocus } from './types';

function subscribeViewport(cb: () => void) {
  window.addEventListener('resize', cb);
  return () => window.removeEventListener('resize', cb);
}

export type DeepSpaceVenueBlockProps = {
  tileIndex: number;
  cinemaLive: number;
  concertLive: number;
  focus: VenueFocus;
  deepLinkRoute?: VenueRoute;
};

export function DeepSpaceVenueBlock({
  tileIndex: t,
  cinemaLive,
  concertLive,
  focus,
  deepLinkRoute,
}: DeepSpaceVenueBlockProps) {
  const mobile = useSyncExternalStore(
    subscribeViewport,
    () => isMobileStaticViewport(),
    () => false,
  );
  const deepSpaceX = deepSpaceMidX(t);
  if (deepSpaceX == null) return null;

  const deepSpaceLiveNow = isVenueLive(
    'deep-space', t, cinemaLive, concertLive, 0, 0, 0, 0, 0, focus, deepLinkRoute,
  );

  const stageHeight = mobile ? DEEP_SPACE_VIDEO_HEIGHT : DEEP_SPACE_HEIGHT;
  const deepSpaceFoW = DEEP_SPACE_WIDTH * DEEP_SPACE_SCALE;
  const deepSpaceFoH = stageHeight * DEEP_SPACE_SCALE;
  const deepSpaceFoY = STAGE_ANCHOR_Y - deepSpaceFoH - DEEP_SPACE_STAGE_LIFT_Y;
  const deepSpaceGlowY = 670 - DEEP_SPACE_STAGE_LIFT_Y;
  const deepSpaceGlowInnerY = 674 - DEEP_SPACE_STAGE_LIFT_Y;

  return (
    <>
      <g>
        <ellipse
          cx={deepSpaceX}
          cy={deepSpaceGlowY}
          rx={deepSpaceFoW / 2 + 24}
          ry={22}
          fill="rgba(54,224,200,.06)"
        />
        <ellipse
          cx={deepSpaceX}
          cy={deepSpaceGlowInnerY}
          rx={deepSpaceFoW / 2 + 10}
          ry={8}
          fill="rgba(54,224,200,.14)"
        />
      </g>
      <foreignObject
        x={deepSpaceX - deepSpaceFoW / 2}
        y={deepSpaceFoY}
        width={deepSpaceFoW}
        height={deepSpaceFoH}
        data-stage-video-fo={deepSpaceLiveNow ? true : undefined}
        style={deepSpaceLiveNow ? STAGE_VIDEO_FO_STYLE : { overflow: 'visible' }}
      >
        <div
          {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as HTMLAttributes<HTMLDivElement>)}
          style={{
            width: DEEP_SPACE_WIDTH,
            transform: `scale(${DEEP_SPACE_SCALE})`,
            transformOrigin: 'top left',
            ...(deepSpaceLiveNow ? STAGE_VIDEO_WRAPPER_STYLE : { pointerEvents: 'none' }),
          }}
        >
          {deepSpaceLiveNow
            ? <DeepSpaceStage live embedVoteStrip={!mobile} />
            : <DeepSpaceShell />}
        </div>
      </foreignObject>
    </>
  );
}
