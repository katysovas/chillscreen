import { SD_GND, FEST_COLORS } from './constants';

/** Iconic balloon chain rising into the sky. */
export function BalloonChain({ x = 1760 }: { x?: number }) {
  const balloons = Array.from({ length: 14 }, (_, i) => ({
    bx: x + Math.sin(i * 0.7) * 22,
    by: SD_GND - 40 - i * 34,
    c: FEST_COLORS[i % FEST_COLORS.length],
    r: 13 - i * 0.4,
  }));

  return (
    <g>
      <path
        d={`M${x},${SD_GND} ${balloons.map(b => `L${b.bx},${b.by}`).join(' ')}`}
        fill="none"
        stroke="rgba(80,80,90,.4)"
        strokeWidth={1}
      />
      {balloons.map((b, i) => (
        <g key={i}>
          <ellipse cx={b.bx} cy={b.by} rx={b.r} ry={b.r * 1.15} fill={b.c} />
          <ellipse
            cx={b.bx - b.r * 0.3}
            cy={b.by - b.r * 0.4}
            rx={b.r * 0.3}
            ry={b.r * 0.4}
            fill="rgba(255,255,255,.4)"
          />
        </g>
      ))}
    </g>
  );
}
