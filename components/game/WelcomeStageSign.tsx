import {
  welcomeSignGroundX,
  welcomeStagesByDirection,
  type WelcomeStageEntry,
} from '@/lib/welcomeSign';
import { ArrowSignBoard } from './city/ArrowSignBoard';

function ArrowSign({
  cy,
  dir,
  entry,
  halfLen,
  halfH,
  tipLen,
}: {
  cy: number;
  dir: 'left' | 'right';
  entry: WelcomeStageEntry;
  halfLen: number;
  halfH: number;
  tipLen: number;
}) {
  return (
    <ArrowSignBoard
      cy={cy}
      dir={dir}
      label={entry.label}
      icon={entry.icon}
      accent={entry.accent}
      halfLen={halfLen}
      halfH={halfH}
      tipLen={tipLen}
    />
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

/**
 * Spawn junction sign — header on the pole, left/right arrow-shaped stage wings.
 */
export function WelcomeStageSign({ spawnWorldOff, y = 697 }: WelcomeStageSignProps) {
  const signGroundX = welcomeSignGroundX(spawnWorldOff);
  const { left, right } = welcomeStagesByDirection(signGroundX);
  const rowCount = Math.max(left.length, right.length, 1);

  const postW = 8;
  const basePostH = 30;
  const headerW = 200;
  const headerH = 44;
  const arrowHalfLen = 66;
  const arrowHalfH = 21;
  const arrowTipLen = 20;
  const rowH = arrowHalfH * 2 + 4;
  const wingOffset = arrowHalfLen + 20;
  const rowGap = 10;
  const headerGap = 12;

  const rowsHeight = rowCount * rowH + (rowCount - 1) * rowGap;
  const headerTop = -basePostH - headerGap - rowsHeight - headerH;
  const firstRowCy = firstRowCenterY(headerTop, headerH, headerGap, rowH);
  const postTop = headerTop - 4;
  const postTotalH = -postTop;

  function rowCy(i: number) {
    return firstRowCy + i * (rowH + rowGap);
  }

  return (
    <g transform={`translate(${signGroundX},${y})`} className="welcome-stage-sign">
      <ellipse cx={0} cy={3} rx={headerW / 2 + wingOffset * 0.55} ry={7} fill="rgba(0,0,0,.22)" />

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

      {Array.from({ length: rowCount }, (_, i) => {
        const cy = rowCy(i);
        return (
          <g key={`arm-${i}`}>
            {left[i] && (
              <line
                x1={-postW / 2}
                y1={cy}
                x2={-wingOffset + arrowHalfLen}
                y2={cy}
                stroke="#6b5344"
                strokeWidth={3}
                strokeLinecap="round"
              />
            )}
            {right[i] && (
              <line
                x1={postW / 2}
                y1={cy}
                x2={wingOffset - arrowHalfLen}
                y2={cy}
                stroke="#6b5344"
                strokeWidth={3}
                strokeLinecap="round"
              />
            )}
          </g>
        );
      })}

      <HeaderBoard topY={headerTop} boardW={headerW} boardH={headerH} />

      {Array.from({ length: rowCount }, (_, i) => {
        const cy = rowCy(i);
        return (
          <g key={`row-${i}`}>
            {left[i] && (
              <g transform={`translate(${-wingOffset},0)`}>
                <ArrowSign
                  cy={cy}
                  dir="left"
                  entry={left[i]!}
                  halfLen={arrowHalfLen}
                  halfH={arrowHalfH}
                  tipLen={arrowTipLen}
                />
              </g>
            )}
            {right[i] && (
              <g transform={`translate(${wingOffset},0)`}>
                <ArrowSign
                  cy={cy}
                  dir="right"
                  entry={right[i]!}
                  halfLen={arrowHalfLen}
                  halfH={arrowHalfH}
                  tipLen={arrowTipLen}
                />
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}

function firstRowCenterY(headerTop: number, headerH: number, headerGap: number, rowH: number) {
  return headerTop + headerH + headerGap + rowH / 2;
}
