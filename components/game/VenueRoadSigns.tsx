import {
  CINEMA_SIGN_MID_X,
  CONCERT_SIGN_MID_X,
  MID_TILE,
} from '@/lib/venues';

/** Ground-tile x — locked to sidewalk scroll (GND_F). */
export function venueSignGroundX(midX: number, groundTile: number) {
  return Math.round((midX / MID_TILE) * groundTile);
}

/** Sign posts on the sidewalk — between spawn and each venue. */
export function concertSignGroundX(groundTile = 3600) {
  return venueSignGroundX(CONCERT_SIGN_MID_X, groundTile);
}

export function cinemaSignGroundX(groundTile = 3600) {
  return venueSignGroundX(CINEMA_SIGN_MID_X, groundTile);
}

type StreetSignProps = {
  x: number;
  y: number;
  dir: 'left' | 'right';
  label: string;
  accent: string;
  icon: string;
};

/**
 * Full-width arrow inside the sign board (centered on cy, flush to inner edges).
 */
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

function StreetSign({ x, y, dir, label, accent, icon }: StreetSignProps) {
  const postW = 8;
  const postH = 28;
  const boardW = 108;
  const boardH = 56;
  const boardTop = -postH - boardH + 2;
  const boardLeft = -boardW / 2;
  const labelY = boardTop + 18;
  const arrowCy = boardTop + boardH - 14;
  const arrowHalfW = 28;
  const arrowInnerLeft = -arrowHalfW;
  const arrowInnerRight = arrowHalfW;

  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={0} cy={3} rx={24} ry={7} fill="rgba(0,0,0,.22)" />

      {/* post — grows upward from sidewalk */}
      <rect x={-postW / 2} y={-postH} width={postW} height={postH} rx={2} fill="#5c4636" />
      <rect x={-postW / 2 + 1} y={-postH} width={postW - 2} height={postH - 2} rx={1.5} fill="#8a6b4f" />
      <line x1={0} y1={-postH + 4} x2={0} y2={-4} stroke="#6b5344" strokeWidth={1} opacity={0.5} />

      {/* board + content in board-local space */}
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
          fontSize={13}
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
      <StreetSign
        x={cX}
        y={y}
        dir="left"
        label="Concert"
        accent="#1a9a52"
        icon="♪"
      />
      <StreetSign
        x={mX}
        y={y}
        dir="right"
        label="Cinema"
        accent="#b8860b"
        icon="🎬"
      />
    </g>
  );
}
