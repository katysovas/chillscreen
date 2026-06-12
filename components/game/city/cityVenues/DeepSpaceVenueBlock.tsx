import type { HTMLAttributes } from 'react';
import DeepSpaceStage, { DeepSpaceShell } from '../../DeepSpaceStage';
import {
  DEEP_SPACE_HEIGHT,
  DEEP_SPACE_SCALE,
  DEEP_SPACE_WIDTH,
} from '@/lib/stageVideoLayout';
import { STAGE_VIDEO_FO_STYLE, STAGE_VIDEO_WRAPPER_STYLE } from '../../StageVideoFrame';
import { deepSpaceMidX } from '@/lib/venues';
import type { VenueRoute } from '@/lib/venueRoutes';
import { isVenueLive } from '@/lib/venueRoutes';
import { STAGE_ANCHOR_Y } from '@/lib/stageLayout';
import type { VenueFocus } from './types';

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
  const deepSpaceX = deepSpaceMidX(t);
  if (deepSpaceX == null) return null;

  const deepSpaceLiveNow = isVenueLive(
    'deep-space', t, cinemaLive, concertLive, 0, 0, 0, 0, 0, focus, deepLinkRoute,
  );

  const deepSpaceFoW = DEEP_SPACE_WIDTH * DEEP_SPACE_SCALE;
  const deepSpaceFoH = DEEP_SPACE_HEIGHT * DEEP_SPACE_SCALE;
  const deepSpaceFoY = STAGE_ANCHOR_Y - deepSpaceFoH;

  return (
    <>
      <g>
        <ellipse
          cx={deepSpaceX}
          cy={670}
          rx={deepSpaceFoW / 2 + 24}
          ry={22}
          fill="rgba(54,224,200,.06)"
        />
        <ellipse
          cx={deepSpaceX}
          cy={674}
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
          {deepSpaceLiveNow ? <DeepSpaceStage live /> : <DeepSpaceShell />}
        </div>
      </foreignObject>
    </>
  );
}
