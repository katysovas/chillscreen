import {
  TENTAROO_GND,
  WHICH_NEON,
  WHICH_STAGE_MID_X,
  WHICH_STAGE_PUSH_Y,
  WHICH_STAGE_SCALE,
} from './constants';

const cx = WHICH_STAGE_MID_X;
const S = WHICH_STAGE_SCALE;
const pushY = WHICH_STAGE_PUSH_Y;
const ox = cx;
const oy = TENTAROO_GND;
const trussY = 368;

type Props = { tile: number };

/** Truss title — own layer above sky sun/moon (below ground only at the road band). */
export function WhichStageTrussLabel({ tile }: Props) {
  const glowId = `ws-truss-glow-${tile}`;
  return (
    <g transform={`translate(0, ${pushY})`}>
      <g transform={`translate(${ox},${oy}) scale(${S}) translate(${-ox},${-oy})`}>
        <text
          x={cx}
          y={trussY - 18}
          textAnchor="middle"
          fontFamily="Anton, Impact, sans-serif"
          fontSize={28}
          letterSpacing={3}
          fill="#eafff6"
          filter={`url(#${glowId})`}
        >
          WHICH STAGE
          <animate attributeName="opacity" values="1;0.88;0.55;0.95;1" dur="5.5s" repeatCount="indefinite" />
        </text>
      </g>
      <defs>
        <filter id={glowId} x="-80%" y="-80%" width="260%" height="260%">
          <feGaussianBlur stdDeviation="4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
    </g>
  );
}
