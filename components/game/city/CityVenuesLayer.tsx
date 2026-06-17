import type { HTMLAttributes } from 'react';
import Cinema, { CINEMA_SCALE, CINEMA_WIDTH, CinemaShell } from '../Cinema';
import Concert, { CONCERT_SCALE, CONCERT_WIDTH, ConcertShell } from '../Concert';
import DeepSpaceStage, {
  DEEP_SPACE_HEIGHT,
  DEEP_SPACE_SCALE,
  DEEP_SPACE_WIDTH,
  DeepSpaceShell,
} from '../DeepSpaceStage';
import { STAGE_VIDEO_FO_STYLE, STAGE_VIDEO_WRAPPER_STYLE } from '../StageVideoFrame';
import { StageToiletsFlanking } from './street/StageToiletRow';
import { STAGE_TOILET } from '@/lib/stageToilets';
import {
  cinemaMidX,
  concertChannel,
  concertLabel,
  concertMidX,
  deepSpaceMidX,
  type VenueKind,
} from '@/lib/venues';
import type { VenueRoute } from '@/lib/venueRoutes';
import { isVenueLive } from '@/lib/venueRoutes';
import { STAGE_ANCHOR_Y } from '@/lib/stageLayout';

export type VenueFocus = VenueKind;

export type CityVenuesTileProps = {
  tileIndex: number;
  cinemaLive: number;
  concertLive: number;
  focus: VenueFocus;
  cinemaFoW: number;
  cinemaFoH: number;
  cinemaFoY: number;
  concertFoW: number;
  concertFoH: number;
  concertFoY: number;
  /** When set, the deep-linked venue is live on first paint. */
  deepLinkRoute?: VenueRoute;
};

/** Cinema, concert, and Deep Space venues for one mid-layer tile. */
export function CityVenuesTile({
  tileIndex: t,
  cinemaLive,
  concertLive,
  focus,
  cinemaFoW,
  cinemaFoH,
  cinemaFoY,
  concertFoW,
  concertFoH,
  concertFoY,
  deepLinkRoute,
}: CityVenuesTileProps) {
  const isDeepSpace = deepLinkRoute === 'deep-space';
  const concertX = concertMidX(t);
  const cinemaX = cinemaMidX(t);
  const deepSpaceX = deepSpaceMidX(t);
  const concertLiveNow = isVenueLive(
    'concert', t, cinemaLive, concertLive, 0, 0, 0, 0, 0, focus, deepLinkRoute,
  );
  const cinemaLiveNow = isVenueLive(
    'cinema', t, cinemaLive, concertLive, 0, 0, 0, 0, 0, focus, deepLinkRoute,
  );
  const deepSpaceLiveNow = isVenueLive(
    'deep-space', t, cinemaLive, concertLive, 0, 0, 0, 0, 0, focus, deepLinkRoute,
  );

  const deepSpaceFoW = DEEP_SPACE_WIDTH * DEEP_SPACE_SCALE;
  const deepSpaceFoH = DEEP_SPACE_HEIGHT * DEEP_SPACE_SCALE;
  const deepSpaceFoY = STAGE_ANCHOR_Y - deepSpaceFoH;

  const concertBlock =
    concertX != null ? (
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
    ) : null;

  const cinemaBlock =
    cinemaX != null ? (
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
          stageHalfWidth={cinemaFoW / 2 + STAGE_TOILET.stageHalfBleed}
        />
      </>
    ) : null;

  const deepSpaceBlock =
    deepSpaceX != null ? (
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
    ) : null;

  if (!concertBlock && !cinemaBlock && !deepSpaceBlock) return null;

  return (
    <>
      {concertBlock && deepLinkRoute !== 'cinema' && !isDeepSpace ? concertBlock : null}
      {!isDeepSpace && cinemaBlock}
      {isDeepSpace && deepSpaceBlock}
    </>
  );
}
