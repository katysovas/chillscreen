import { SD_WATER } from './constants';

type SanDiegoBayProps = {
  tileIndex?: number;
  fadeLeft?: boolean;
};

/** San Diego Bay water. */
export function SanDiegoBay({ tileIndex = 0, fadeLeft = false }: SanDiegoBayProps) {
  const uid = `sdb${tileIndex}`;
  const fill = fadeLeft ? `url(#${uid}-water)` : SD_WATER;

  return (
    <g>
      {fadeLeft && (
        <defs>
          <linearGradient
            id={`${uid}-water`}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={880}
            y2={0}
          >
            <stop offset="0%" stopColor={SD_WATER} stopOpacity={0} />
            <stop offset="55%" stopColor={SD_WATER} stopOpacity={0.55} />
            <stop offset="100%" stopColor={SD_WATER} stopOpacity={1} />
          </linearGradient>
        </defs>
      )}
      <rect x={0} y={584} width={1050} height={316} fill={fill} />
      <line x1={30} y1={606} x2={300} y2={606} stroke="#a2cee2" strokeWidth={2} opacity={0.55} />
      <line x1={120} y1={624} x2={520} y2={624} stroke="#a2cee2" strokeWidth={2} opacity={0.45} />
      <line x1={260} y1={642} x2={760} y2={642} stroke="#a2cee2" strokeWidth={2} opacity={0.4} />
      {([[180, 596], [430, 612]] as const).map(([sx, sy], i) => (
        <g key={i}>
          <polygon points={`${sx},${sy} ${sx},${sy - 26} ${sx + 18},${sy}`} fill="#eef2f6" />
          <polygon points={`${sx - 2},${sy} ${sx - 2},${sy - 20} ${sx - 16},${sy}`} fill="#dde6ee" />
          <rect x={sx - 18} y={sy} width={38} height={5} rx={2} fill="#cdd6de" />
        </g>
      ))}
    </g>
  );
}
