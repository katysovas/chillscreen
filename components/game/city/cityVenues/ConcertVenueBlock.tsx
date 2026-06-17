import type { HTMLAttributes } from 'react';
import Concert, { ConcertShell } from '../../Concert';
import {
  CONCERT_HEIGHT,
  CONCERT_SCALE,
  CONCERT_WIDTH,
} from '@/lib/stageVideoLayout';
import { STAGE_VIDEO_FO_STYLE, STAGE_VIDEO_WRAPPER_STYLE } from '../../StageVideoFrame';
import { StageToiletsFlanking } from '../street/StageToiletRow';
import { STAGE_TOILET } from '@/lib/stageToilets';
import { concertChannel, concertLabel, concertMidX } from '@/lib/venues';
import type { VenueRoute } from '@/lib/venueRoutes';
import { isVenueLive } from '@/lib/venueRoutes';
import type { VenueFocus } from './types';

export type ConcertVenueBlockProps = {
  tileIndex: number;
  cinemaLive: number;
  concertLive: number;
  focus: VenueFocus;
  concertFoW: number;
  concertFoH: number;
  concertFoY: number;
  deepLinkRoute?: VenueRoute;
};

export function ConcertVenueBlock({
  tileIndex: t,
  cinemaLive,
  concertLive,
  focus,
  concertFoW,
  concertFoH,
  concertFoY,
  deepLinkRoute,
}: ConcertVenueBlockProps) {
  const concertX = concertMidX(t);
  if (concertX == null) return null;

  const concertLiveNow = isVenueLive(
    'concert', t, cinemaLive, concertLive, 0, 0, 0, 0, 0, focus, deepLinkRoute,
  );

  return (
    <>
      <g>
        <ellipse cx={concertX} cy={668} rx={concertFoW / 2 + 18} ry={16} fill="rgba(10,40,24,.25)" />
        <rect
          x={concertX - concertFoW / 2 - 18}
          y={656}
          width={concertFoW + 36}
          height={14}
          fill="#7a8a82"
          rx={3}
        />
        <rect
          x={concertX - concertFoW / 2 - 18}
          y={656}
          width={concertFoW + 36}
          height={4}
          fill="rgba(56,216,128,.1)"
          rx={2}
        />
      </g>
      <foreignObject
        x={concertX - concertFoW / 2}
        y={concertFoY}
        width={concertFoW}
        height={concertFoH}
        data-stage-video-fo={concertLiveNow ? true : undefined}
        style={concertLiveNow ? STAGE_VIDEO_FO_STYLE : { overflow: 'visible' }}
      >
        <div
          {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as HTMLAttributes<HTMLDivElement>)}
          style={{
            width: CONCERT_WIDTH,
            transform: `scale(${CONCERT_SCALE})`,
            transformOrigin: 'top left',
            ...(concertLiveNow ? STAGE_VIDEO_WRAPPER_STYLE : { pointerEvents: 'none' }),
          }}
        >
          {concertLiveNow ? (
            <Concert
              live
              label={concertLabel(t) ?? undefined}
              channel={concertChannel(t)}
            />
          ) : (
            <ConcertShell
              label={concertLabel(t) ?? undefined}
              channel={concertChannel(t)}
            />
          )}
        </div>
      </foreignObject>
      <StageToiletsFlanking
        centerX={concertX}
        stageHalfWidth={concertFoW / 2 + STAGE_TOILET.stageHalfBleed}
      />
    </>
  );
}
