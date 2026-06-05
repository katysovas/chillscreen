type TowerDef = { x: number; y: number; w: number; h: number; c: string };

const TOWERS: TowerDef[] = [
  { x: 1150, y: 660, w: 72, h: 185, c: '#c0c8d5' },
  { x: 1230, y: 660, w: 58, h: 210, c: '#c8d0dc' },
  { x: 1460, y: 660, w: 85, h: 168, c: '#b8c2cc' },
  { x: 1558, y: 660, w: 62, h: 195, c: '#c0cad5' },
  { x: 1632, y: 660, w: 75, h: 158, c: '#bac4d0' },
];

function GlassTower({ b, index }: { b: TowerDef; index: number }) {
  const rows = Math.floor((b.h - 15) / 22);
  const cols = Math.floor((b.w - 14) / 16);
  return (
    <g key={index}>
      <rect x={b.x} y={b.y - b.h} width={b.w} height={b.h} fill={b.c} />
      <rect x={b.x} y={b.y - b.h} width={11} height={b.h} fill="rgba(0,20,60,.22)" />
      <rect x={b.x + b.w - 9} y={b.y - b.h} width={9} height={b.h} fill="rgba(255,230,140,.12)" />
      {Array.from({ length: rows }, (_, r) =>
        Array.from({ length: cols }, (_, c) => (
          <rect
            key={`${r}-${c}`}
            x={b.x + 8 + c * 16}
            y={b.y - b.h + 8 + r * 22}
            width={11}
            height={14}
            rx={1}
            fill="rgba(140,200,240,.55)"
            opacity={(index + r + c) % 5 === 0 ? 0.2 : 0.65}
          />
        )),
      )}
      <rect x={b.x - 2} y={b.y - b.h - 4} width={b.w + 4} height={5} fill="rgba(0,20,60,.3)" />
    </g>
  );
}

export function ModernTowers() {
  return <>{TOWERS.map((b, i) => <GlassTower key={i} b={b} index={i} />)}</>;
}
