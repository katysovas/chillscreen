import type { HTMLAttributes } from 'react';
import Cinema, { CINEMA_SCALE, CINEMA_WIDTH, CinemaShell } from '../Cinema';
import Concert, { CONCERT_SCALE, CONCERT_WIDTH, ConcertShell } from '../Concert';
import { StageToiletsBeside } from './street/StageToiletRow';
import { cinemaMidX, concertChannel, concertLabel, concertMidX, type VenueKind } from '@/lib/venues';
import type { VenueRoute } from '@/lib/venueRoutes';
import { isVenueLive } from '@/lib/venueRoutes';

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

/** Cinema and concert venues for one mid-layer tile. */
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
  const concertX = concertMidX(t);
  const cinemaX = cinemaMidX(t);
  const concertLiveNow = isVenueLive(
    'concert', t, cinemaLive, concertLive, 0, 0, 0, focus, deepLinkRoute,
  );
  const cinemaLiveNow = isVenueLive(
    'cinema', t, cinemaLive, concertLive, 0, 0, 0, focus, deepLinkRoute,
  );

  // Always render on the tile — parallax viewBox scrolling slides them in from
  // the edge. Gating on isVenueInView used stale scroll state and made venues pop in.
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
          style={{ overflow: 'visible' }}
        >
          <div
            {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as HTMLAttributes<HTMLDivElement>)}
            style={{
              width: CONCERT_WIDTH,
              transform: `scale(${CONCERT_SCALE})`,
              transformOrigin: 'top left',
              pointerEvents: concertLiveNow ? 'auto' : 'none',
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
        <StageToiletsBeside
          centerX={concertX}
          stageHalfWidth={concertFoW / 2 + 18}
          side="right"
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
          style={{ overflow: 'visible' }}
        >
          <div
            {...({ xmlns: 'http://www.w3.org/1999/xhtml' } as HTMLAttributes<HTMLDivElement>)}
            style={{
              width: CINEMA_WIDTH,
              transform: `scale(${CINEMA_SCALE})`,
              transformOrigin: 'top left',
              pointerEvents: cinemaLiveNow ? 'auto' : 'none',
            }}
          >
            {cinemaLiveNow ? <Cinema live /> : <CinemaShell />}
          </div>
        </foreignObject>
        <StageToiletsBeside
          centerX={cinemaX}
          stageHalfWidth={cinemaFoW / 2 + 14}
          side="left"
        />
      </>
    ) : null;

  if (!concertBlock && !cinemaBlock) return null;

  return (
    <>
      {concertBlock}
      {cinemaBlock}
    </>
  );
}
