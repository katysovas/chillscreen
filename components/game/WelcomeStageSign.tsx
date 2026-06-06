import {
  walkDirectionFromGroundX,
  welcomeSignGroundX,
  welcomeStageEntries,
  type WelcomeStageEntry,
} from '@/lib/welcomeSign';

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

function StageBoard({
  topY,
  entry,
  signGroundX,
  boardW,
  boardH,
}: {
  topY: number;
  entry: WelcomeStageEntry;
  signGroundX: number;
  boardW: number;
  boardH: number;
}) {
  const dir = walkDirectionFromGroundX(signGroundX, entry.tileIndex, entry.venueMidX);
  const boardLeft = -boardW / 2;
  const labelY = topY + 18;
  const arrowCy = topY + boardH - 13;
  const arrowHalfW = 26;
  const fontSize = entry.label.length > 14 ? 9 : entry.label.length > 8 ? 10 : 12;

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
        fill={entry.accent}
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
      <rect x={-12} y={topY + boardH - 3} width={24} height={5} rx={2} fill="#6b5344" />

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
        {entry.icon} {entry.label}
      </text>
      <path
        d={arrowPath(dir, arrowCy, -arrowHalfW, arrowHalfW)}
        fill={entry.accent}
        stroke="#2a2820"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
    </g>
  );
}

function HeaderBoard({ topY, boardW, boardH }: { topY: number; boardW: number; boardH: number }) {
  const boardLeft = -boardW / 2;

  return (
    <g>
      <rect
        x={boardLeft}
        y={topY}
        width={boardW}
        height={boardH}
        rx={8}
        fill="#0d0122"
        stroke="#00e5d4"
        strokeWidth={2.5}
      />
      <rect
        x={boardLeft + 5}
        y={topY + 5}
        width={boardW - 10}
        height={boardH - 10}
        rx={5}
        fill="none"
        stroke="#00e5d4"
        strokeWidth={1}
        opacity={0.22}
      />
      <rect x={-12} y={topY + boardH - 3} width={24} height={5} rx={2} fill="#6b5344" />

      <text
        x={0}
        y={topY + boardH / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={14}
        fontWeight={900}
        fill="#00e5d4"
        fontFamily="system-ui, -apple-system, sans-serif"
        letterSpacing={0.5}
      >
        Which Stage?
      </text>
    </g>
  );
}

type WelcomeStageSignProps = {
  spawnWorldOff: number;
  /** Ground-layer sidewalk y (feet line). */
  y?: number;
};

/** Spawn-area trail post listing every stage with walk directions. */
export function WelcomeStageSign({ spawnWorldOff, y = 697 }: WelcomeStageSignProps) {
  const signGroundX = welcomeSignGroundX(spawnWorldOff);
  const entries = welcomeStageEntries();

  const postW = 8;
  const basePostH = 30;
  const boardW = 168;
  const stageBoardH = 50;
  const headerBoardH = 44;
  const stickGap = 14;

  let cursorY = -basePostH;
  const stageTops: number[] = [];
  for (let i = entries.length - 1; i >= 0; i--) {
    cursorY -= stageBoardH;
    stageTops[i] = cursorY;
    if (i > 0) cursorY -= stickGap;
  }

  const headerTop = cursorY - stickGap - headerBoardH;
  const postTop = headerTop - 4;
  const postTotalH = -postTop;

  return (
    <g transform={`translate(${signGroundX},${y})`} className="welcome-stage-sign">
      <ellipse cx={0} cy={3} rx={30} ry={7} fill="rgba(0,0,0,.22)" />

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

      <HeaderBoard topY={headerTop} boardW={boardW} boardH={headerBoardH} />
      {entries.map((entry, i) => (
        <StageBoard
          key={entry.id}
          topY={stageTops[i]!}
          entry={entry}
          signGroundX={signGroundX}
          boardW={boardW}
          boardH={stageBoardH}
        />
      ))}
    </g>
  );
}
