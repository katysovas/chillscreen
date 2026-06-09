import { STAGE_TOILET, stageToiletStartX, type StageToiletRow as StageToiletRowDef } from '@/lib/stageToilets';

/** Five porta-potties in a row on the sidewalk. */
export function StageToiletRow({ startX, y }: StageToiletRowDef) {
  const { width, height, gap, count, src } = STAGE_TOILET;

  return (
    <g className="stage-toilets">
      {Array.from({ length: count }, (_, i) => {
        const x = startX + i * (width + gap);
        return (
          <g key={i} transform={`translate(${x},${y})`}>
            <ellipse
              cx={width / 2}
              cy={height - 2}
              rx={width / 2 + 2}
              ry={5}
              fill="rgba(0,0,0,.18)"
            />
            <image
              href={src}
              width={width}
              height={height}
              preserveAspectRatio="xMidYMax meet"
            />
          </g>
        );
      })}
    </g>
  );
}

/** Porta-potty row beside a stage footprint. */
export function StageToiletsBeside({
  centerX,
  stageHalfWidth,
  side,
  y = STAGE_TOILET.sidewalkY,
}: {
  centerX: number;
  stageHalfWidth: number;
  side: 'left' | 'right';
  y?: number;
}) {
  return (
    <StageToiletRow
      startX={stageToiletStartX(centerX, stageHalfWidth, side)}
      y={y}
    />
  );
}

/** Porta-potty rows on both sides of a stage. Half-widths may differ when the
 *  stage is scaled about an off-center origin (e.g. the desert festival rig). */
export function StageToiletsFlanking({
  centerX,
  stageHalfWidth,
  leftHalfWidth,
  rightHalfWidth,
  y = STAGE_TOILET.sidewalkY,
}: {
  centerX: number;
  stageHalfWidth: number;
  leftHalfWidth?: number;
  rightHalfWidth?: number;
  y?: number;
}) {
  return (
    <>
      <StageToiletsBeside
        centerX={centerX}
        stageHalfWidth={leftHalfWidth ?? stageHalfWidth}
        side="left"
        y={y}
      />
      <StageToiletsBeside
        centerX={centerX}
        stageHalfWidth={rightHalfWidth ?? stageHalfWidth}
        side="right"
        y={y}
      />
    </>
  );
}
