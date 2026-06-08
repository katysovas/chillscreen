import { Victorian } from './Victorian';
import { SimpleBuilding } from './SimpleBuilding';
import { CoitTower } from './CoitTower';
import { ModernTowers } from './ModernTower';
import { HillsideHouse } from './HillsideHouse';
import { DECORATIVE_SHAPE } from '../shared/parallaxLayerStyle';

/** Shift skyline east — clear of Golden Gate / bay (left ~0–520). */
export const CITY_BUILDINGS_OFFSET_X = 560;

const VICTORIAN_ROW = [
  { x: 488, y: 652, col: '#6a7ec8', w: 63, h: 145 },
  { x: 558, y: 654, col: '#c8a030', w: 63, h: 148 },
  { x: 628, y: 656, col: '#7a9a58', w: 63, h: 152 },
  { x: 698, y: 658, col: '#c87840', w: 63, h: 148 },
  { x: 768, y: 660, col: '#a05888', w: 63, h: 145 },
] as const;

const SIMPLE_BLOCKS = [
  [250, 658, '#a0a8b8', 55, 120],
  [310, 656, '#a8b0c0', 58, 128],
  [838, 660, '#b8b090', 60, 138],
  [902, 662, '#a8a888', 58, 128],
] as const;

/** Building skyline for one mid-layer tile (offset east of the bridge). */
export function CityBuildingsTile() {
  return (
    <g {...DECORATIVE_SHAPE} transform={`translate(${CITY_BUILDINGS_OFFSET_X},0)`}>
      {VICTORIAN_ROW.map((b, i) => (
        <Victorian key={i} x={b.x} y={b.y} col={b.col} w={b.w} h={b.h} />
      ))}
      {SIMPLE_BLOCKS.map(([x, y, c, w, h], i) => (
        <SimpleBuilding key={`s${i}`} x={x} y={y} color={c} width={w} height={h} />
      ))}
      <CoitTower />
      <ModernTowers />
      <HillsideHouse />
    </g>
  );
}
