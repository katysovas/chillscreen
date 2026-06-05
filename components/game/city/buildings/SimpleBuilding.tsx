type SimpleBuildingProps = {
  x: number;
  y: number;
  color: string;
  width: number;
  height: number;
};

/** Compact apartment block with shallow roof. */
export function SimpleBuilding({ x, y, color, width, height }: SimpleBuildingProps) {
  return (
    <g>
      <rect x={x} y={y - height} width={width} height={height} fill={color} />
      <rect x={x} y={y - height} width={8} height={height} fill="rgba(0,20,60,.18)" />
      <polygon points={`${x+width/2},${y-height-18} ${x-3},${y-height} ${x+width+3},${y-height}`} fill="#8a8880" />
      <rect x={x+6} y={y-height+20} width={14} height={18} fill="rgba(140,180,210,.5)" />
      <rect x={x+30} y={y-height+20} width={14} height={18} fill="rgba(140,180,210,.5)" />
    </g>
  );
}
