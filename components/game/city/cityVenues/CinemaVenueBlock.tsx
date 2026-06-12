import type { HTMLAttributes } from 'react';
import Cinema, { CinemaShell } from '../../Cinema';
import {
  CINEMA_HEIGHT,
  CINEMA_SCALE,
  CINEMA_WIDTH,
} from '@/lib/stageVideoLayout';
import { STAGE_VIDEO_FO_STYLE, STAGE_VIDEO_WRAPPER_STYLE } from '../../StageVideoFrame';
import { StageToiletsFlanking } from '../street/StageToiletRow';
import { cinemaMidX } from '@/lib/venues';
import type { VenueRoute } from '@/lib/venueRoutes';
import { isVenueLive } from '@/lib/venueRoutes';
import type { VenueFocus } from './types';

export type CinemaVenueBlockProps = {
  tileIndex: number;
  cinemaLive: number;
  concertLive: number;
  focus: VenueFocus;
  cinemaFoW: number;
  cinemaFoH: number;
  cinemaFoY: number;
  deepLinkRoute?: VenueRoute;
};

export function CinemaVenueBlock({
  tileIndex: t,
  cinemaLive,
  concertLive,
  focus,
  cinemaFoW,
  cinemaFoH,
  cinemaFoY,
  deepLinkRoute,
}: CinemaVenueBlockProps) {
  const cinemaX = cinemaMidX(t);
  if (cinemaX == null) return null;

  const cinemaLiveNow = isVenueLive(
    'cinema', t, cinemaLive, concertLive, 0, 0, 0, 0, 0, focus, deepLinkRoute,
  );

  return (
    <>
      <g>
        <ellipse cx={cinemaX} cy={668} rx={cinemaFoW / 2 + 14} ry={16} fill="rgba(20,40,80,.2)" />
        <rect
          x={cinemaX - cinemaFoW / 2 - 14}
          y={656}
          width={cinemaFoW + 28}
          height={14}
          fill="#8a9488"
          rx={3}
        />
        <rect
          x={cinemaX - cinemaFoW / 2 - 14}
          y={656}
          width={cinemaFoW + 28}
          height={4}
          fill="rgba(255,230,140,.08)"
          rx={2}
        />
      </g>
      <foreignObject
        x={cinemaX - cinemaFoW / 2}
        y={cinemaFoY}
        width={cinemaFoW}
        height={cinemaFoH}
        data-stage-video-fo={cinemaLiveNow ? true : undefined}
        style={cinemaLiveNow ? STAGE_VIDEO_FO_STYLE : { overflow: 'visible' }}
      >
        <div
          {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as HTMLAttributes<HTMLDivElement>)}
          style={{
            width: CINEMA_WIDTH,
            transform: `scale(${CINEMA_SCALE})`,
            transformOrigin: 'top left',
            ...(cinemaLiveNow ? STAGE_VIDEO_WRAPPER_STYLE : { pointerEvents: 'none' }),
          }}
        >
          {cinemaLiveNow ? <Cinema live /> : <CinemaShell />}
        </div>
      </foreignObject>
      <StageToiletsFlanking
        centerX={cinemaX}
        stageHalfWidth={cinemaFoW / 2 + 14}
      />
    </>
  );
}
