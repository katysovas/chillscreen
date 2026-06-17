const SECTIONS = 4;
const CELL_W = 54;
const CELL_H = 34;
const CELL_PITCH = 38;
const TOWER_CX = 27;
const CONE_R = 8;

type Props = {
  transform: string;
  cabGradId: string;
  coneGradId: string;
  strokeColor: string;
  accentColor: string;
  /** Optional — very light opacity pulse on the top driver only. */
  topPulseClass?: string;
  topPulseAnim?: string;
  topPulseDelay?: string;
};

/** Stacked PA cabinet with visible drivers (creator stage side towers). */
export function CreatorSpeakerTower({
  transform,
  cabGradId,
  coneGradId,
  strokeColor,
  accentColor,
  topPulseClass,
  topPulseAnim,
  topPulseDelay,
}: Props) {
  const topPulse = Boolean(topPulseClass && topPulseAnim);
  const towerH = (SECTIONS - 1) * CELL_PITCH + CELL_H;
  const ringR = CONE_R + 2;

  return (
    <g transform={transform}>
      <rect
        x={0}
        y={0}
        width={CELL_W}
        height={towerH}
        rx={6}
        fill={`url(#${cabGradId})`}
        stroke={strokeColor}
        strokeWidth={1.2}
      />
      <rect
        x={2}
        y={2}
        width={CELL_W - 4}
        height={towerH - 4}
        rx={5}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth={1}
      />
      <line
        x1={CELL_W - 1}
        y1={4}
        x2={CELL_W - 1}
        y2={towerH - 4}
        stroke="rgba(255,255,255,0.05)"
        strokeWidth={1}
      />

      {Array.from({ length: SECTIONS }, (_, j) => {
        const cy = j * CELL_PITCH + CELL_H / 2;
        const y0 = j * CELL_PITCH;
        return (
          <g key={j}>
            {j > 0 && (
              <line
                x1={5}
                y1={y0}
                x2={CELL_W - 5}
                y2={y0}
                stroke="rgba(0,0,0,0.4)"
                strokeWidth={1}
              />
            )}
            {[0.28, 0.5, 0.72].map(t => (
              <line
                key={t}
                x1={8}
                y1={y0 + CELL_H * t}
                x2={CELL_W - 8}
                y2={y0 + CELL_H * t}
                stroke="rgba(0,0,0,0.22)"
                strokeWidth={0.6}
              />
            ))}
            <circle
              cx={TOWER_CX}
              cy={cy}
              r={ringR}
              fill="#070d0b"
              stroke={strokeColor}
              strokeWidth={1}
            />
            <circle cx={TOWER_CX} cy={cy} r={CONE_R} fill={`url(#${coneGradId})`} />
            <circle
              cx={TOWER_CX}
              cy={cy}
              r={CONE_R * 0.65}
              fill="none"
              stroke="rgba(0,0,0,0.5)"
              strokeWidth={0.9}
            />
            <circle cx={TOWER_CX} cy={cy} r={CONE_R * 0.2} fill="#243830" />
            <circle
              className={topPulse && j === 0 ? topPulseClass : undefined}
              cx={TOWER_CX}
              cy={cy}
              r={ringR + 0.5}
              fill="none"
              stroke={accentColor}
              strokeWidth={0.6}
              opacity={topPulse && j === 0 ? undefined : 0.35}
              style={topPulse && j === 0 ? {
                animation: topPulseAnim,
                animationDelay: topPulseDelay,
              } : undefined}
            />
          </g>
        );
      })}
    </g>
  );
}
