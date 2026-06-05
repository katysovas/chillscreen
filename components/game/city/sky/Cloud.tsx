type CloudProps = {
  x: number;
  y: number;
  s?: number;
  anim?: string;
  del?: number;
  variant?: 'day' | 'warm' | 'dim';
};

const DRIFT: Record<string, { dx: number; dur: number }> = {
  cloud1: { dx: 16, dur: 18 },
  cloud2: { dx: -12, dur: 18 },
  cloud3: { dx: 9, dur: 18 },
};

/** Cloud puff — drift via SVG animateTransform (avoids CSS transform compositor bugs). */
export function Cloud({
  x,
  y,
  s = 1,
  anim = 'cloud1',
  del = 0,
  variant = 'day',
}: CloudProps) {
  const fills =
    variant === 'warm'
      ? ['#ffe8d0', '#fff0e0', '#fff4e8', '#ffe8d0', '#ffd8c0']
      : variant === 'dim'
        ? ['#7888a0', '#8494ac', '#8a9ab2', '#7888a0', '#708098']
        : ['#edf2f8', '#f2f7fc', '#f5f9fd', '#f2f7fc', '#edf2f8'];
  const shadow =
    variant === 'warm'
      ? 'rgba(255,180,140,.24)'
      : variant === 'dim'
        ? 'rgba(60,80,110,.2)'
        : 'rgba(170,195,225,.28)';

  const drift = DRIFT[anim] ?? DRIFT.cloud1;
  const dur = drift.dur + del * 3;
  const dx = drift.dx;

  return (
    <g transform={`translate(${x},${y}) scale(${s})`} opacity={variant === 'dim' ? 0.45 : 1}>
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values={`0,0; ${dx},0; 0,0`}
          dur={`${dur}s`}
          begin={`${del}s`}
          repeatCount="indefinite"
          calcMode="spline"
          keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
          keyTimes="0; 0.5; 1"
        />
        <ellipse cx={60} cy={22} rx={70} ry={20} fill={fills[0]} />
        <circle cx={28} cy={12} r={22} fill={fills[1]} />
        <circle cx={58} cy={2} r={28} fill={fills[2]} />
        <circle cx={88} cy={9} r={24} fill={fills[3]} />
        <circle cx={112} cy={16} r={18} fill={fills[4]} />
        <ellipse cx={62} cy={28} rx={58} ry={11} fill={shadow} />
      </g>
    </g>
  );
}
