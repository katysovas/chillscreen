type LampPostProps = {
  x: number;
  y: number;
};

export function LampPost({ x, y }: LampPostProps) {
  return (
    <g>
      <ellipse cx={x + 16} cy={y + 5} rx={13} ry={4} fill="rgba(20,40,80,.2)" />
      <rect x={x - 3} y={y - 118} width={6} height={118} fill="#5a5848" rx={2} />
      <rect x={x + 1} y={y - 118} width={2} height={118} fill="rgba(255,210,100,.18)" rx={1} />
      <rect x={x - 1} y={y - 124} width={32} height={3} rx={1} fill="#5a5848" />
      <circle cx={x + 30} cy={y - 121} r={9} fill="#fff8d8" opacity={0.92} />
      <circle cx={x + 30} cy={y - 121} r={16} fill="rgba(255,240,160,.32)" />
    </g>
  );
}
