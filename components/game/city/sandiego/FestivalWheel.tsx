import { SD_GND, FEST_COLORS } from './constants';

// Default wheel geometry pre-computed at module load.
const CX = 1680;
const CY = 498;
const R  = 96;
const N  = 18;

const PTS = Array.from({ length: N }, (_, i) => {
  const a = (i / N) * Math.PI * 2;
  return { gx: CX + Math.cos(a) * R, gy: CY + Math.sin(a) * R };
});

/** Festival Ferris wheel — white frame, rainbow gondolas. */
export function FestivalWheel({ cx = CX, cy = CY, r = R }: { cx?: number; cy?: number; r?: number }) {
  // If called with non-default props, recompute; otherwise use the pre-computed array.
  const pts =
    cx === CX && cy === CY && r === R
      ? PTS
      : Array.from({ length: N }, (_, i) => {
          const a = (i / N) * Math.PI * 2;
          return { gx: cx + Math.cos(a) * r, gy: cy + Math.sin(a) * r };
        });

  return (
    <g>
      <line x1={cx} y1={cy} x2={cx - 70} y2={SD_GND} stroke="#d6dae0" strokeWidth={7} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + 70} y2={SD_GND} stroke="#d6dae0" strokeWidth={7} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx - 30} y2={SD_GND} stroke="#bcc2cc" strokeWidth={5} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + 30} y2={SD_GND} stroke="#bcc2cc" strokeWidth={5} strokeLinecap="round" />
      <rect x={cx - 92} y={SD_GND - 4} width={184} height={8} rx={2} fill="#6f5a44" />
      {pts.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.gx} y2={p.gy} stroke="rgba(230,234,240,.6)" strokeWidth={1.2} />
      ))}
      <circle cx={cx} cy={cy} r={r}     fill="none" stroke="#e6eaf0" strokeWidth={3.5} />
      <circle cx={cx} cy={cy} r={r - 9} fill="none" stroke="rgba(230,234,240,.45)" strokeWidth={1.5} />
      <circle cx={cx} cy={cy} r={11}    fill="#d6dae0" stroke="#bcc2cc" strokeWidth={2} />
      {pts.map((p, i) => (
        <g key={i}>
          <rect x={p.gx - 5} y={p.gy - 4} width={10} height={11} rx={2.5} fill={FEST_COLORS[i % FEST_COLORS.length]} />
          <rect x={p.gx - 5} y={p.gy - 4} width={10} height={4}  rx={2}   fill="rgba(255,255,255,.3)" />
        </g>
      ))}
    </g>
  );
}
