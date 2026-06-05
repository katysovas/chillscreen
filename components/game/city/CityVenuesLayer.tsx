import type { HTMLAttributes } from 'react';
import Cinema, { CINEMA_SCALE, CINEMA_WIDTH } from '../Cinema';
import Concert, { CONCERT_SCALE, CONCERT_WIDTH } from '../Concert';
import { cinemaMidX, concertChannel, concertLabel, concertMidX, isVenueInView, type VenueKind } from '@/lib/venues';

export type VenueFocus = VenueKind;

export type CityVenuesTileProps = {
  tileIndex: number;
  vx: number;
  cinemaLive: number;
  concertLive: number;
  focus: VenueFocus;
  cinemaHalf: number;
  concertHalf: number;
  cinemaFoW: number;
  cinemaFoH: number;
  cinemaFoY: number;
  concertFoW: number;
  concertFoH: number;
  concertFoY: number;
};

/** Cinema and concert venues for one mid-layer tile. */
export function CityVenuesTile({
  tileIndex: t,
  vx,
  cinemaLive,
  concertLive,
  focus,
  cinemaHalf,
  concertHalf,
  cinemaFoW,
  cinemaFoH,
  cinemaFoY,
  concertFoW,
  concertFoH,
  concertFoY,
}: CityVenuesTileProps) {
  const concertX = concertMidX(t);
  const cinemaX = cinemaMidX(t);

  const concertBlock =
    concertX != null && isVenueInView(vx, t, concertX, concertHalf) ? (
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
              pointerEvents: t === concertLive && focus === 'concert' ? 'auto' : 'none',
            }}
          >
            <Concert
              live={t === concertLive && focus === 'concert'}
              label={concertLabel(t) ?? undefined}
              channel={concertChannel(t)}
            />
          </div>
        </foreignObject>
      </>
    ) : null;

  const cinemaBlock =
    cinemaX != null && isVenueInView(vx, t, cinemaX, cinemaHalf) ? (
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
              pointerEvents: t === cinemaLive ? 'auto' : 'none',
            }}
          >
            <Cinema live={t === cinemaLive} />
          </div>
        </foreignObject>
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
