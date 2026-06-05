import { SEATTLE_GND } from './constants';

/** Space Needle landmark. */
export function SpaceNeedle() {
  const cx = 700;
  const GND = SEATTLE_GND;

  return (
    <g>
      <path
        d={`M${cx - 40},${GND} Q${cx - 28},555 ${cx - 9},478`}
        stroke="#aab1bf"
        strokeWidth={9}
        fill="none"
        strokeLinecap="round"
      />
      <path
        d={`M${cx + 40},${GND} Q${cx + 28},555 ${cx + 9},478`}
        stroke="#aab1bf"
        strokeWidth={9}
        fill="none"
        strokeLinecap="round"
      />
      <path d={`M${cx},${GND} L${cx},478`} stroke="#9aa1af" strokeWidth={7} fill="none" />
      <ellipse cx={cx} cy={500} rx={26} ry={6} fill="none" stroke="rgba(150,158,172,.6)" strokeWidth={2} />
      <rect x={cx - 8} y={378} width={16} height={102} fill="#c4c9d3" />
      <rect x={cx - 8} y={378} width={4} height={102} fill="rgba(0,20,50,.18)" />
      <polygon points={`${cx - 8},378 ${cx + 8},378 ${cx + 54},354 ${cx - 54},354`} fill="#bcc2ce" />
      <line x1={cx - 30} y1={364} x2={cx - 44} y2={355} stroke="rgba(206,164,106,.55)" strokeWidth={2} />
      <line x1={cx + 30} y1={364} x2={cx + 44} y2={355} stroke="rgba(206,164,106,.55)" strokeWidth={2} />
      <ellipse cx={cx} cy={354} rx={62} ry={9} fill="#d4d9e1" />
      <rect x={cx - 60} y={342} width={120} height={13} rx={6} fill="#cbd0da" />
      {Array.from({ length: 11 }, (_, i) => (
        <line
          key={i}
          x1={cx - 52 + i * 10.4}
          y1={343}
          x2={cx - 52 + i * 10.4}
          y2={354}
          stroke="rgba(110,150,195,.35)"
          strokeWidth={1}
        />
      ))}
      <path d={`M${cx - 50},342 Q${cx},318 ${cx + 50},342 Z`} fill="#d8dde5" />
      <rect x={cx - 1.5} y={300} width={3} height={20} fill="#9aa0ae" />
      <circle cx={cx} cy={298} r={3} fill="#e8503c" />
      <circle cx={cx} cy={298} r={5.5} fill="rgba(232,80,60,.3)" />
    </g>
  );
}
