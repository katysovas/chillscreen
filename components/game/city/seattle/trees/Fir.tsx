type FirProps = {
  x: number;
  y: number;
  h: number;
  w: number;
};

/** Layered conical Pacific-Northwest fir. */
export function Fir({ x, y, h, w }: FirProps) {
  return (
    <g>
      <rect x={x - 3} y={y - h * 0.16} width={6} height={h * 0.16} fill="#3a2a1c" />
      <polygon
        points={`${x},${y - h} ${x - w * 0.42},${y - h * 0.4} ${x + w * 0.42},${y - h * 0.4}`}
        fill="#2b4636"
      />
      <polygon
        points={`${x},${y - h * 0.74} ${x - w * 0.5},${y - h * 0.2} ${x + w * 0.5},${y - h * 0.2}`}
        fill="#315140"
      />
      <polygon
        points={`${x},${y - h * 0.46} ${x - w * 0.58},${y} ${x + w * 0.58},${y}`}
        fill="#2a4634"
      />
      <polygon
        points={`${x},${y - h * 0.74} ${x},${y - h * 0.2} ${x + w * 0.5},${y - h * 0.2}`}
        fill="rgba(0,0,0,.12)"
      />
    </g>
  );
}
