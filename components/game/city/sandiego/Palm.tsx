import { SD_GND } from './constants';

/** Curved date/fan palm. */
export function Palm({ x, h, lean = 0 }: { x: number; h: number; lean?: number }) {
  const topY = SD_GND - h;
  const tx = x + lean;
  const frond = (dx: number, dy: number, cx: number, cy: number) =>
    `M${tx},${topY} Q${tx + cx},${topY + cy} ${tx + dx},${topY + dy}`;

  return (
    <g>
      <ellipse cx={x} cy={SD_GND + 4} rx={h * 0.16} ry={5} fill="rgba(40,30,20,.18)" />
      <path
        d={`M${x},${SD_GND} Q${x + lean * 0.5},${topY + h * 0.45} ${tx},${topY}`}
        stroke="#8a6a48"
        strokeWidth={Math.max(4, h * 0.045)}
        fill="none"
        strokeLinecap="round"
      />
      <g stroke="#3c7a3e" strokeWidth={4} fill="none" strokeLinecap="round">
        <path d={frond(-56, 8, -34, -14)} />
        <path d={frond(-40, -42, -26, -28)} />
        <path d={frond(2, -56, 2, -34)} />
        <path d={frond(44, -40, 28, -28)} />
        <path d={frond(58, 8, 36, -14)} />
        <path d={frond(-46, 22, -22, -2)} />
        <path d={frond(48, 22, 24, -2)} />
      </g>
      <circle cx={tx} cy={topY} r={5} fill="#5a4a30" />
    </g>
  );
}
