import { MID_W } from '../shared/terrainPaths';
import { MID_GND, SF_BRIDGE_CLEAR_X } from '../shared/terrainPaths';
import { SimpleBuilding } from '../buildings/SimpleBuilding';
import { isSeattleTile } from '../seattle/tileKind';
import { blendHex } from './blendColors';

const EDGE_W = 520;
const RIGHT_X0 = MID_W - EDGE_W;

type Cottage = { x: number; y: number; w: number; h: number; color: string };

function cottagesAlong(
  xStart: number,
  xEnd: number,
  count: number,
  fromSeattle: boolean,
  toSeattle: boolean,
): Cottage[] {
  const out: Cottage[] = [];
  for (let i = 0; i < count; i++) {
    const t = count <= 1 ? 0.5 : i / (count - 1);
    const x = xStart + (xEnd - xStart) * (0.08 + t * 0.84);
    const u = fromSeattle === toSeattle ? 0.5 : toSeattle ? t : 1 - t;
    out.push({
      x,
      y: MID_GND - 2 + (i % 3) * 2,
      w: 34 + (i % 4) * 5,
      h: 72 + (i % 5) * 11,
      color: blendHex(
        blendHex('#a8b0b8', '#8a9a88', u),
        blendHex('#b8b090', '#7a9080', u),
        0.35 + (i % 3) * 0.12,
      ),
    });
  }
  return out;
}

type TransitionBuildingsProps = {
  tileIndex: number;
};

/** Small blocks at tile edges when SF ↔ Seattle changes. */
export function TransitionBuildings({ tileIndex }: TransitionBuildingsProps) {
  const seattle = isSeattleTile(tileIndex);
  const leftOther = isSeattleTile(tileIndex - 1);
  const rightOther = isSeattleTile(tileIndex + 1);
  const cottages: Cottage[] = [];

  if (seattle !== leftOther) {
    if (seattle) {
      cottages.push(...cottagesAlong(40, EDGE_W - 20, 10, leftOther, seattle));
    } else {
      // SF tile: leave the bridge / bay clear on the left
      cottages.push(
        ...cottagesAlong(SF_BRIDGE_CLEAR_X, 960, 8, leftOther, seattle),
      );
    }
  }
  if (seattle !== rightOther) {
    cottages.push(...cottagesAlong(RIGHT_X0 + 20, MID_W - 40, 10, seattle, rightOther));
  }

  if (cottages.length === 0) return null;

  return (
    <g>
      {cottages.map((c, i) => (
        <SimpleBuilding
          key={i}
          x={c.x}
          y={c.y}
          color={c.color}
          width={c.w}
          height={c.h}
        />
      ))}
    </g>
  );
}
