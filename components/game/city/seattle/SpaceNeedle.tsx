import { SEATTLE_GND } from './constants';

// All geometry pre-computed at module load.
const CX  = 700;
const GND = SEATTLE_GND;

const LEG_L = `M${CX - 40},${GND} Q${CX - 28},555 ${CX - 9},478`;
const LEG_R = `M${CX + 40},${GND} Q${CX + 28},555 ${CX + 9},478`;
const SHAFT = `M${CX},${GND} L${CX},478`;

// 11 saucer-rim mullion lines as a single compact SVG path (stripes in the ring).
// Each line goes from y=343 to y=354, spaced 10.4px apart starting at CX−52.
const MULLION_PATH = Array.from(
  { length: 11 },
  (_, i) => `M${(CX - 52 + i * 10.4).toFixed(1)},343 L${(CX - 52 + i * 10.4).toFixed(1)},354`,
).join(' ');

const HAT_ARCH = `M${CX - 50},342 Q${CX},318 ${CX + 50},342 Z`;

/** Space Needle landmark. */
export function SpaceNeedle() {
  return (
    <g>
      <path d={LEG_L} stroke="#aab1bf" strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d={LEG_R} stroke="#aab1bf" strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d={SHAFT} stroke="#9aa1af" strokeWidth={7} fill="none" />
      <ellipse cx={CX} cy={500} rx={26} ry={6} fill="none" stroke="rgba(150,158,172,.6)" strokeWidth={2} />
      <rect x={CX - 8} y={378} width={16} height={102} fill="#c4c9d3" />
      <rect x={CX - 8} y={378} width={4}  height={102} fill="rgba(0,20,50,.18)" />
      <polygon points={`${CX - 8},378 ${CX + 8},378 ${CX + 54},354 ${CX - 54},354`} fill="#bcc2ce" />
      <line x1={CX - 30} y1={364} x2={CX - 44} y2={355} stroke="rgba(206,164,106,.55)" strokeWidth={2} />
      <line x1={CX + 30} y1={364} x2={CX + 44} y2={355} stroke="rgba(206,164,106,.55)" strokeWidth={2} />
      <ellipse cx={CX} cy={354} rx={62} ry={9} fill="#d4d9e1" />
      <rect x={CX - 60} y={342} width={120} height={13} rx={6} fill="#cbd0da" />
      {/* Saucer rim mullions — single path instead of 11 separate elements */}
      <path d={MULLION_PATH} stroke="rgba(110,150,195,.35)" strokeWidth={1} fill="none" />
      <path d={HAT_ARCH} fill="#d8dde5" />
      <rect x={CX - 1.5} y={300} width={3} height={20} fill="#9aa0ae" />
      <circle cx={CX} cy={298} r={3}   fill="#e8503c" />
      <circle cx={CX} cy={298} r={5.5} fill="rgba(232,80,60,.3)" />
    </g>
  );
}
