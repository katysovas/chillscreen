import { citySignsForTile } from '@/lib/citySigns';
import { resolveSignGroundLocalX } from '@/lib/signPlacement';
import { ArrowSignBoard } from './city/ArrowSignBoard';

type CombinedTownSignProps = {
  x: number;
  y: number;
  leftCity: { label: string; icon: string; accent: string };
  rightCity: { label: string; icon: string; accent: string };
};

/** Trail junction — left/right arrow wings on one post (same shape as welcome sign). */
function CombinedTownSign({ x, y, leftCity, rightCity }: CombinedTownSignProps) {
  const basePostH = 30;
  const arrowHalfLen = 62;
  const arrowHalfH = 20;
  const arrowTipLen = 18;
  const rowH = arrowHalfH * 2 + 4;
  const rowGap = 14;
  const wingOffset = arrowHalfLen + 18;

  const lowerCy = -basePostH - arrowHalfH - 2;
  const upperCy = lowerCy - rowH - rowGap;
  const postTop = upperCy - arrowHalfH - 6;
  const postH = -postTop;

  const postW = 8;

  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse cx={0} cy={3} rx={wingOffset + 14} ry={7} fill="rgba(0,0,0,.22)" />

      <rect x={-postW / 2} y={postTop} width={postW} height={postH} rx={2} fill="#5c4636" />
      <rect
        x={-postW / 2 + 1}
        y={postTop}
        width={postW - 2}
        height={postH - 2}
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
      <line
        x1={-postW / 2}
        y1={upperCy}
        x2={-wingOffset + arrowHalfLen}
        y2={upperCy}
        stroke="#6b5344"
        strokeWidth={3}
        strokeLinecap="round"
      />
      <line
        x1={postW / 2}
        y1={lowerCy}
        x2={wingOffset - arrowHalfLen}
        y2={lowerCy}
        stroke="#6b5344"
        strokeWidth={3}
        strokeLinecap="round"
      />

      <g transform={`translate(${-wingOffset},0)`}>
        <ArrowSignBoard
          cy={upperCy}
          dir="left"
          label={leftCity.label}
          icon={leftCity.icon}
          accent={leftCity.accent}
          halfLen={arrowHalfLen}
          halfH={arrowHalfH}
          tipLen={arrowTipLen}
        />
      </g>
      <g transform={`translate(${wingOffset},0)`}>
        <ArrowSignBoard
          cy={lowerCy}
          dir="right"
          label={rightCity.label}
          icon={rightCity.icon}
          accent={rightCity.accent}
          halfLen={arrowHalfLen}
          halfH={arrowHalfH}
          tipLen={arrowTipLen}
        />
      </g>
    </g>
  );
}

type TileRoadSignsProps = {
  tileIndex: number;
  y: number;
  groundTile?: number;
};

/** Combined junction signs on connector towns only. */
export function TileRoadSigns({ tileIndex, y, groundTile = 3600 }: TileRoadSignsProps) {
  const citySigns = citySignsForTile(tileIndex);

  return (
    <g className="road-signs">
      {citySigns.map((sign, i) => {
        const x = resolveSignGroundLocalX(tileIndex, Math.round(sign.xFrac * groundTile), groundTile);

        return (
          <g
            key={`city-${i}`}
            data-road-sign=""
            data-sign-tile={tileIndex}
            data-sign-x={x}
          >
            <CombinedTownSign
              x={x}
              y={y}
              leftCity={sign.leftCity}
              rightCity={sign.rightCity}
            />
          </g>
        );
      })}
    </g>
  );
}
