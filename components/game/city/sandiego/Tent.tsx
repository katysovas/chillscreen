import { SD_GND, FEST_COLORS } from './constants';

/** Peaked festival tent (marquee). */
export function Tent({ x, w, h, col }: { x: number; w: number; h: number; col: string }) {
  const peak = (px: number, pw: number) =>
    `M${px - pw},${SD_GND} Q${px},${SD_GND - h - 8} ${px + pw},${SD_GND} Z`;

  return (
    <g>
      <ellipse cx={x} cy={SD_GND + 4} rx={w * 0.55} ry={5} fill="rgba(40,30,20,.16)" />
      <path
        d={`M${x - w / 2},${SD_GND} L${x - w / 2},${SD_GND - h * 0.5} L${x},${SD_GND - h} L${x + w / 2},${SD_GND - h * 0.5} L${x + w / 2},${SD_GND} Z`}
        fill={col}
      />
      <path d={peak(x, w * 0.16)} fill={col} />
      <path
        d={`M${x - w / 2},${SD_GND - h * 0.5} L${x},${SD_GND - h} L${x + w / 2},${SD_GND - h * 0.5}`}
        fill="none"
        stroke="rgba(0,0,0,.12)"
        strokeWidth={1.5}
      />
      <path
        d={`M${x - w / 2},${SD_GND - h * 0.5} q${w * 0.12},10 ${w * 0.24},0 q${w * 0.12},10 ${w * 0.24},0 q${w * 0.12},10 ${w * 0.24},0 q${w * 0.12},10 ${w * 0.24},0`}
        fill="none"
        stroke="rgba(0,0,0,.14)"
        strokeWidth={2}
      />
      <rect x={x - 0.8} y={SD_GND - h - 22} width={1.6} height={16} fill="#7a6a52" />
      <polygon
        points={`${x},${SD_GND - h - 22} ${x + 16},${SD_GND - h - 17} ${x},${SD_GND - h - 12}`}
        fill={FEST_COLORS[(x | 0) % FEST_COLORS.length]}
      />
    </g>
  );
}
