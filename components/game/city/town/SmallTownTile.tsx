import { MID_GND, MID_W } from '../shared/terrainPaths';
import { SimpleBuilding } from '../buildings/SimpleBuilding';
import { Victorian } from '../buildings/Victorian';
import { isSfToSdTown, isTownTile, tileRand } from '@/lib/worldTiles';
import { TownDesertEdge } from './TownDesertEdge';

const PALETTE = [
  '#a8b0b8',
  '#b8b090',
  '#9a8a88',
  '#8a9a88',
  '#c0a878',
  '#a0a8c0',
  '#b0a898',
  '#98a890',
  '#c8b8a0',
  '#8898a8',
] as const;

type Building = {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  kind: 'simple' | 'victorian';
};

function townLayout(tileIndex: number, compact: boolean, width: number): Building[] {
  const count = compact ? 10 : 42;
  const xMax = compact ? width - 70 : MID_W - 120;
  const out: Building[] = [];

  for (let i = 0; i < count; i++) {
    const rx = tileRand(tileIndex, `tx${i}`);
    const ry = tileRand(tileIndex, `ty${i}`);
    const rs = tileRand(tileIndex, `ts${i}`);
    const x = 48 + rx * (xMax - 48);
    const w = 30 + Math.floor(rs * 5) * 5;
    const h = compact
      ? 44 + Math.floor(ry * 4) * 10
      : 52 + Math.floor(ry * 6) * 12;
    const color = PALETTE[Math.floor(tileRand(tileIndex, `tc${i}`) * PALETTE.length)];
    const kind = rs > 0.82 ? 'victorian' : 'simple';

    out.push({
      x,
      y: MID_GND - 2 + (i % 4) * 2,
      w,
      h,
      color,
      kind,
    });
  }

  return out.sort((a, b) => a.x - b.x);
}

type Tree = { x: number; y: number; r: number };

function townTrees(tileIndex: number, compact: boolean, width: number): Tree[] {
  const trees: Tree[] = [];
  const max = compact ? 6 : 14;
  const xMax = compact ? width - 110 : MID_W - 160;

  for (let i = 0; i < max; i++) {
    const t = tileRand(tileIndex, `tr${i}`);
    if (t < 0.35) continue;
    trees.push({
      x: 80 + tileRand(tileIndex, `trx${i}`) * xMax,
      y: MID_GND,
      r: compact
        ? 11 + Math.floor(tileRand(tileIndex, `trr${i}`) * 2) * 3
        : 14 + Math.floor(tileRand(tileIndex, `trr${i}`) * 3) * 4,
    });
  }
  return trees;
}

/**
 * Continuous town ground/desert blend. Stays INSIDE the mid layer's horizontal
 * tile scale (authored across MID_W) so the gradients fill the short town tile
 * and blend smoothly into the neighbouring city — scaling a gradient is
 * imperceptible, unlike scaling discrete buildings.
 */
export function SmallTownTerrain({ tileIndex }: { tileIndex: number }) {
  const compact = isSfToSdTown(tileIndex) || isTownTile(tileIndex);

  return (
    <g>
      {!compact && (
        <path
          d={`M-2,${MID_GND + 8} Q${MID_W * 0.25},${MID_GND - 6} ${MID_W * 0.5},${MID_GND + 4}
            Q${MID_W * 0.78},${MID_GND + 12} ${MID_W},${MID_GND + 6}
            L${MID_W + 2},900 L-2,900 Z`}
          fill="#8a9880"
          opacity={0.28}
          shapeRendering="optimizeSpeed"
        />
      )}
      {compact && (
        <path
          d={`M0,${MID_GND + 8} Q${MID_W * 0.18},${MID_GND - 4} ${MID_W * 0.36},${MID_GND + 2}
            L${980},${MID_GND + 4} L980,900 L0,900 Z`}
          fill="#8a9880"
          opacity={0.28}
          shapeRendering="optimizeSpeed"
        />
      )}
      {compact && isSfToSdTown(tileIndex) && <TownDesertEdge tileIndex={tileIndex} />}
    </g>
  );
}

type SmallTownTileProps = {
  tileIndex: number;
  /** Natural tile width (town tiles are short); props are laid out to fit. */
  tileWidth?: number;
};

/**
 * Discrete small-town cottages and trees — rendered at NATURAL proportions
 * (no horizontal squeeze). Laid out within the tile's real width so short town
 * connectors simply show fewer buildings rather than squashed ones.
 */
export function SmallTownTile({ tileIndex, tileWidth = MID_W }: SmallTownTileProps) {
  const compact = isSfToSdTown(tileIndex) || isTownTile(tileIndex);
  const buildings = townLayout(tileIndex, compact, tileWidth);
  const trees = townTrees(tileIndex, compact, tileWidth);

  return (
    <g>
      {buildings.map((b, i) =>
        b.kind === 'victorian' ? (
          <Victorian key={i} x={b.x} y={b.y} col={b.color} w={b.w + 18} h={b.h + 20} />
        ) : (
          <SimpleBuilding
            key={i}
            x={b.x}
            y={b.y}
            color={b.color}
            width={b.w}
            height={b.h}
          />
        ),
      )}
      {trees.map((tr, i) => (
        <g key={`t${i}`}>
          <rect x={tr.x - 2} y={tr.y - tr.r * 1.6} width={4} height={tr.r * 1.6} fill="#4a3828" rx={1} />
          <circle cx={tr.x} cy={tr.y - tr.r * 1.8} r={tr.r} fill="#3a6838" />
          <circle cx={tr.x - tr.r * 0.45} cy={tr.y - tr.r * 1.5} r={tr.r * 0.65} fill="#427040" />
        </g>
      ))}
    </g>
  );
}
