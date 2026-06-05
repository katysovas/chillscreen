import { SD_GND } from './constants';

/** Festoon string lights draped between poles. */
export function StringLights({ xs = [1560, 1780, 2000, 2240] }: { xs?: number[] }) {
  const top = 470;
  const sag = 40;

  return (
    <g>
      {xs.map((px, i) => (
        <rect key={i} x={px - 2} y={top - 6} width={4} height={SD_GND - top + 6} fill="#6f5a44" opacity={0.7} />
      ))}
      {xs.slice(0, -1).map((px, i) => {
        const nx = xs[i + 1];
        const midX = (px + nx) / 2;
        const bulbs = Array.from({ length: 9 }, (_, b) => {
          const t = (b + 1) / 10;
          const u = 1 - t;
          const bx = u * u * px + 2 * u * t * midX + t * t * nx;
          const by = u * u * top + 2 * u * t * (top + sag) + t * t * top;
          return { bx, by };
        });
        return (
          <g key={i}>
            <path
              d={`M${px},${top} Q${midX},${top + sag} ${nx},${top}`}
              fill="none"
              stroke="rgba(60,50,40,.5)"
              strokeWidth={1}
            />
            {bulbs.map((bl, j) => (
              <circle key={j} cx={bl.bx} cy={bl.by} r={2.4} fill="#ffe6a0" opacity={0.9} />
            ))}
          </g>
        );
      })}
    </g>
  );
}
