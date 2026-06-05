type VictorianProps = {
  x: number;
  y: number;
  col: string;
  w?: number;
  h?: number;
};

/** Painted Victorian row house with bay windows. */
export function Victorian({ x, y, col, w = 66, h = 148 }: VictorianProps) {
  const win = 'rgba(150,200,230,.72)';
  return (
    <g>
      <ellipse cx={x + w * 0.35} cy={y + 5} rx={w * 0.62} ry={8} fill="rgba(20,40,80,.2)" />
      <rect x={x} y={y - h} width={w} height={h} fill={col} />
      <rect x={x} y={y - h} width={10} height={h} fill="rgba(0,20,60,.22)" />
      <rect x={x + w - 8} y={y - h} width={8} height={h} fill="rgba(255,220,120,.12)" />
      <polygon points={`${x+w/2},${y-h-26} ${x-4},${y-h} ${x+w+4},${y-h}`} fill="#7a6858" />
      <polygon points={`${x+w/2},${y-h-26} ${x-4},${y-h} ${x+w/2+2},${y-h}`} fill="rgba(0,0,0,.22)" />
      <rect x={x-4} y={y-h-2} width={w+8} height={7} fill="#f0e8d0" />
      <polygon points={`${x+w/2},${y-h-22} ${x+2},${y-h} ${x+w-2},${y-h}`} fill="none" stroke="#f0e8d0" strokeWidth={1.8} />
      <rect x={x+4}  y={y-h+16} width={25} height={58} fill={col} />
      <rect x={x+4}  y={y-h+16} width={25} height={3}  fill="#f0e8d0" />
      <rect x={x+4}  y={y-h+71} width={25} height={3}  fill="#f0e8d0" />
      <rect x={x+4}  y={y-h+16} width={2}  height={58} fill="rgba(0,0,0,.12)" />
      <rect x={x+38} y={y-h+16} width={25} height={58} fill={col} />
      <rect x={x+38} y={y-h+16} width={25} height={3}  fill="#f0e8d0" />
      <rect x={x+38} y={y-h+71} width={25} height={3}  fill="#f0e8d0" />
      <rect x={x+7}  y={y-h+22} width={19} height={24} fill={win} />
      <rect x={x+41} y={y-h+22} width={19} height={24} fill={win} />
      <rect x={x+7}  y={y-h+82} width={19} height={22} fill={win} opacity={.85} />
      <rect x={x+41} y={y-h+82} width={19} height={22} fill={win} opacity={.85} />
      <rect x={x} y={y-h+80} width={w} height={4} fill="#e8dcc8" opacity={.9} />
      <rect x={x+23} y={y-h+116} width={20} height={32} rx={2} fill="rgba(90,140,170,.65)" />
      <rect x={x+18} y={y-4} width={30} height={4} rx={1} fill="#d8c8a0" />
    </g>
  );
}
