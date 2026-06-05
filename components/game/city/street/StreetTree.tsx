type StreetTreeProps = {
  x: number;
  y: number;
  h?: number;
  sp?: number;
};

export function StreetTree({ x, y, h = 190, sp = 88 }: StreetTreeProps) {
  const tw = Math.round(h * 0.072);
  return (
    <g>
      <ellipse cx={x + sp * 0.3} cy={y + 6} rx={sp * 0.58} ry={11} fill="rgba(20,50,0,.22)" />
      <rect x={x - tw / 2} y={y - h * 0.52} width={tw} height={h * 0.52} fill="#5a3e28" rx={2} />
      <rect x={x + tw / 2 - 3} y={y - h * 0.52} width={3} height={h * 0.52} fill="rgba(255,170,60,.14)" />
      <circle cx={x - sp * 0.14} cy={y - h * 0.72} r={sp * 0.5} fill="#1e6820" />
      <circle cx={x + sp * 0.18} cy={y - h * 0.76} r={sp * 0.48} fill="#256825" />
      <circle cx={x} cy={y - h * 0.64} r={sp * 0.54} fill="#2d7828" />
      <circle cx={x - sp * 0.28} cy={y - h * 0.62} r={sp * 0.38} fill="#348030" />
      <circle cx={x + sp * 0.32} cy={y - h * 0.67} r={sp * 0.42} fill="#2e7a2a" />
      <circle cx={x + sp * 0.1} cy={y - h * 0.84} r={sp * 0.2} fill="#3a9230" opacity={0.55} />
      <ellipse cx={x} cy={y - h * 0.57} rx={sp * 0.52} ry={sp * 0.18} fill="rgba(0,30,0,.22)" />
    </g>
  );
}
