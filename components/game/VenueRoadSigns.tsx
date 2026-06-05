import {
  CINEMA_SIGN_MID_X,
  CONCERT_SIGN_MID_X,
  MID_TILE,
  VIEW_CENTER_X,
  cinemaMidX,
  concertLabel,
  concertMidX,
} from '@/lib/venues';
import { citySignsForTile } from '@/lib/citySigns';
import {
  isSanFranciscoTile,
  isSeattleTile,
  isSouthernCaliforniaTile,
} from '@/lib/worldTiles';
import { MID_F } from '@/lib/parallax';
import { gndOriginForTile, midOriginForTile } from '@/lib/worldTileGeometry';
import { COACHELLA_STAGE_MID_X } from '@/components/game/city/sandiego/constants';

/** Ground-tile x — locked to sidewalk scroll (GND_F). */
export function venueSignGroundX(midX: number, groundTile: number) {
  return Math.round((midX / MID_TILE) * groundTile);
}

export function concertSignGroundX(groundTile = 3600) {
  return venueSignGroundX(CONCERT_SIGN_MID_X, groundTile);
}

export function cinemaSignGroundX(groundTile = 3600) {
  return venueSignGroundX(CINEMA_SIGN_MID_X, groundTile);
}

export type StreetSignProps = {
  x: number;
  y: number;
  dir: 'left' | 'right';
  label: string;
  accent: string;
  icon: string;
};

function arrowPath(
  dir: 'left' | 'right',
  cy: number,
  innerLeft: number,
  innerRight: number,
) {
  const wing = 4;
  const head = 8;
  if (dir === 'left') {
    return [
      `M${innerLeft},${cy}`,
      `L${innerLeft + head},${cy - wing}`,
      `L${innerRight},${cy - wing}`,
      `L${innerRight},${cy + wing}`,
      `L${innerLeft + head},${cy + wing}`,
      'Z',
    ].join(' ');
  }
  return [
    `M${innerRight},${cy}`,
    `L${innerRight - head},${cy - wing}`,
    `L${innerLeft},${cy - wing}`,
    `L${innerLeft},${cy + wing}`,
    `L${innerRight - head},${cy + wing}`,
    'Z',
  ].join(' ');
}

export function StreetSign({ x, y, dir, label, accent, icon }: StreetSignProps) {
  const postW = 8;
  const postH = 28;
  const boardW = label.length > 12 ? 138 : 108;
  const boardH = 56;
  const boardTop = -postH - boardH + 2;
  const boardLeft = -boardW / 2;
  const labelY = boardTop + 18;
  const arrowCy = boardTop + boardH - 14;
  const arrowHalfW = 28;
  const arrowInnerLeft = -arrowHalfW;
  const arrowInnerRight = arrowHalfW;
  const fontSize = label.length > 12 ? 9 : label.length > 8 ? 10 : 13;

  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={0} cy={3} rx={24} ry={7} fill="rgba(0,0,0,.22)" />

      <rect x={-postW / 2} y={-postH} width={postW} height={postH} rx={2} fill="#5c4636" />
      <rect x={-postW / 2 + 1} y={-postH} width={postW - 2} height={postH - 2} rx={1.5} fill="#8a6b4f" />
      <line x1={0} y1={-postH + 4} x2={0} y2={-4} stroke="#6b5344" strokeWidth={1} opacity={0.5} />

      <g>
        <rect
          x={boardLeft}
          y={boardTop}
          width={boardW}
          height={boardH}
          rx={6}
          fill="#faf6ee"
          stroke="#3a342c"
          strokeWidth={2.5}
        />
        <rect
          x={boardLeft + 5}
          y={boardTop + 5}
          width={boardW - 10}
          height={boardH - 10}
          rx={4}
          fill={accent}
          opacity={0.18}
        />
        {[
          [boardLeft + 10, boardTop + 10],
          [boardLeft + boardW - 10, boardTop + 10],
          [boardLeft + 10, boardTop + boardH - 10],
          [boardLeft + boardW - 10, boardTop + boardH - 10],
        ].map(([bx, by], i) => (
          <circle key={i} cx={bx} cy={by} r={2.5} fill="#5c4636" stroke="#3a342c" strokeWidth={0.8} />
        ))}
        <rect x={-14} y={boardTop + boardH - 4} width={28} height={6} rx={2} fill="#6b5344" />

        <text
          x={0}
          y={labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize={fontSize}
          fontWeight={800}
          fill="#2a2820"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          {icon} {label}
        </text>
        <path
          d={arrowPath(dir, arrowCy, arrowInnerLeft, arrowInnerRight)}
          fill={accent}
          stroke="#2a2820"
          strokeWidth={1.5}
          strokeLinejoin="round"
        />
      </g>
    </g>
  );
}

type TrailBoardProps = {
  topY: number;
  dir: 'left' | 'right';
  label: string;
  icon: string;
  accent: string;
  boardW: number;
  boardH: number;
};

/** Single trail-style direction board (mounts on shared post). */
function TrailSignBoard({ topY, dir, label, icon, accent, boardW, boardH }: TrailBoardProps) {
  const boardLeft = -boardW / 2;
  const labelY = topY + 18;
  const arrowCy = topY + boardH - 13;
  const arrowHalfW = 26;
  const fontSize = label.length > 12 ? 9 : label.length > 8 ? 10 : 12;
  const labelX = dir === 'left' ? 8 : -8;

  return (
    <g>
      <rect
        x={boardLeft}
        y={topY}
        width={boardW}
        height={boardH}
        rx={5}
        fill="#faf6ee"
        stroke="#3a342c"
        strokeWidth={2.5}
      />
      <rect
        x={boardLeft + 5}
        y={topY + 5}
        width={boardW - 10}
        height={boardH - 10}
        rx={3}
        fill={accent}
        opacity={0.18}
      />
      {[
        [boardLeft + 9, topY + 8],
        [boardLeft + boardW - 9, topY + 8],
        [boardLeft + 9, topY + boardH - 8],
        [boardLeft + boardW - 9, topY + boardH - 8],
      ].map(([bx, by], i) => (
        <circle key={i} cx={bx} cy={by} r={2.2} fill="#5c4636" stroke="#3a342c" strokeWidth={0.7} />
      ))}
      <rect
        x={-12}
        y={topY + boardH - 3}
        width={24}
        height={5}
        rx={2}
        fill="#6b5344"
      />

      <text
        x={labelX}
        y={labelY}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={fontSize}
        fontWeight={800}
        fill="#2a2820"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        {icon} {label}
      </text>
      <path
        d={arrowPath(dir, arrowCy, -arrowHalfW, arrowHalfW)}
        fill={accent}
        stroke="#2a2820"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </g>
  );
}

type CombinedTownSignProps = {
  x: number;
  y: number;
  leftCity: { label: string; icon: string; accent: string };
  rightCity: { label: string; icon: string; accent: string };
};

/** Trail junction — two separate boards on one post with stick visible between. */
function CombinedTownSign({ x, y, leftCity, rightCity }: CombinedTownSignProps) {
  const postW = 8;
  const basePostH = 30;
  const boardW = 152;
  const boardH = 50;
  const stickGap = 20;

  const lowerBoardTop = -basePostH - boardH;
  const upperBoardTop = lowerBoardTop - stickGap - boardH;
  const postTop = upperBoardTop - 4;
  const postTotalH = -postTop;

  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={0} cy={3} rx={30} ry={7} fill="rgba(0,0,0,.22)" />

      {/* continuous post — visible in the gap between boards */}
      <rect x={-postW / 2} y={postTop} width={postW} height={postTotalH} rx={2} fill="#5c4636" />
      <rect
        x={-postW / 2 + 1}
        y={postTop}
        width={postW - 2}
        height={postTotalH - 2}
        rx={1.5}
        fill="#8a6b4f"
      />
      <line
        x1={0}
        y1={postTop + 6}
        x2={0}
        y2={-4}
        stroke="#6b5344"
        strokeWidth={1}
        opacity={0.45}
      />
      <circle cx={0} cy={postTop + 2} r={3} fill="#6b5344" stroke="#3a342c" strokeWidth={0.8} />

      <TrailSignBoard
        topY={lowerBoardTop}
        dir="right"
        label={rightCity.label}
        icon={rightCity.icon}
        accent={rightCity.accent}
        boardW={boardW}
        boardH={boardH}
      />
      <TrailSignBoard
        topY={upperBoardTop}
        dir="left"
        label={leftCity.label}
        icon={leftCity.icon}
        accent={leftCity.accent}
        boardW={boardW}
        boardH={boardH}
      />
    </g>
  );
}

type TileRoadSignsProps = {
  tileIndex: number;
  y: number;
  groundTile?: number;
};

/**
 * Walk-direction-accurate venue sign.
 *
 * Signs live on the GROUND layer (parallax 1.0) but venues live on the MID
 * layer (parallax 0.35), so comparing their on-screen x positions gives the
 * wrong answer. The only coordinate both share is `worldOff` (the master
 * travel offset). We compute the worldOff at which the venue centers vs. the
 * worldOff at which the sign centers; if the venue centers further right
 * (larger worldOff) the player must walk right, otherwise left. This is correct
 * no matter which side the player approaches from.
 */
function VenueArrowSign({
  tileIndex,
  venueMidX,
  label,
  accent,
  icon,
  groundTile,
  y,
}: {
  tileIndex: number;
  venueMidX: number;
  label: string;
  accent: string;
  icon: string;
  groundTile: number;
  y: number;
}) {
  // Place the sign near the venue's ground-equivalent x (clamped clear of the
  // tile edges / city exit sign). Placement is cosmetic; direction is exact.
  const venueGround = venueSignGroundX(venueMidX, groundTile);
  const signX = Math.min(Math.max(90, venueGround - 300), groundTile - 700);

  const worldOffVenueCenters =
    (midOriginForTile(tileIndex) + venueMidX - VIEW_CENTER_X) / MID_F;
  const worldOffSignCenters =
    gndOriginForTile(tileIndex) + signX - VIEW_CENTER_X;
  const dir: 'left' | 'right' =
    worldOffVenueCenters >= worldOffSignCenters ? 'right' : 'left';

  return <StreetSign x={signX} y={y} dir={dir} label={label} accent={accent} icon={icon} />;
}

/** City direction signs + venue signs (only in their home city). */
export function TileRoadSigns({ tileIndex, y, groundTile = 3600 }: TileRoadSignsProps) {
  const citySigns = citySignsForTile(tileIndex);

  return (
    <g className="road-signs">
      {citySigns.map((sign, i) =>
        sign.type === 'combined' ? (
          <CombinedTownSign
            key={`city-${i}`}
            x={Math.round(sign.xFrac * groundTile)}
            y={y}
            leftCity={sign.leftCity}
            rightCity={sign.rightCity}
          />
        ) : (
          <StreetSign
            key={`city-${i}`}
            x={Math.round(sign.xFrac * groundTile)}
            y={y}
            dir={sign.dir}
            label={sign.label}
            accent={sign.accent}
            icon={sign.icon}
          />
        ),
      )}
      {isSeattleTile(tileIndex) && concertMidX(tileIndex) != null && (
        <VenueArrowSign
          tileIndex={tileIndex}
          venueMidX={concertMidX(tileIndex)!}
          label={concertLabel(tileIndex) ?? 'Seattle Concerts'}
          accent="#1a9a52"
          icon="♪"
          groundTile={groundTile}
          y={y}
        />
      )}
      {isSanFranciscoTile(tileIndex) && (
        <>
          {concertMidX(tileIndex) != null && (
            <VenueArrowSign
              tileIndex={tileIndex}
              venueMidX={concertMidX(tileIndex)!}
              label={concertLabel(tileIndex) ?? 'Outside Hands'}
              accent="#1a9a52"
              icon="♪"
              groundTile={groundTile}
              y={y}
            />
          )}
          <VenueArrowSign
            tileIndex={tileIndex}
            venueMidX={cinemaMidX(tileIndex) ?? CINEMA_SIGN_MID_X}
            label="Cinema"
            accent="#b8860b"
            icon="🎬"
            groundTile={groundTile}
            y={y}
          />
        </>
      )}
      {isSouthernCaliforniaTile(tileIndex) && (
        <VenueArrowSign
          tileIndex={tileIndex}
          venueMidX={COACHELLA_STAGE_MID_X}
          label="Couchella"
          accent="#e85074"
          icon="🎡"
          groundTile={groundTile}
          y={y}
        />
      )}
    </g>
  );
}

/** @deprecated Use TileRoadSigns per tile — kept for tests / imports. */
export function VenueRoadSigns({
  y,
  concertX,
  cinemaX,
  groundTile = 3600,
}: {
  y: number;
  concertX?: number;
  cinemaX?: number;
  groundTile?: number;
}) {
  const cX = concertX ?? concertSignGroundX(groundTile);
  const mX = cinemaX ?? cinemaSignGroundX(groundTile);
  return (
    <g className="venue-road-signs">
      <StreetSign x={cX} y={y} dir="left" label="Concert" accent="#1a9a52" icon="♪" />
      <StreetSign x={mX} y={y} dir="right" label="Cinema" accent="#b8860b" icon="🎬" />
    </g>
  );
}
