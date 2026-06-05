/** Ground tile width — matches SFCity GND_TILE. */
export const GND_TILE = 3600;

/** Tree x positions within each ground tile (same as GroundLayer). */
export const GROUND_TREE_XS = [
  250, 500, 780, 1050, 1340, 1620, 1900, 2180, 2460, 2740, 3020, 3280,
];

export type TreeCatPlacement = {
  id: string;
  /** x within the ground tile */
  x: number;
  scale: number;
  flip: boolean;
};

/** Fixed cat spots — one on load, others further along the street. */
const CAT_SPOTS: { id: string; tile: number; treeIndex: number }[] = [
  { id: 'slc-home', tile: 0, treeIndex: 1 },       // ~x500 — visible on init
  // Tiles ±1 are short town connectors (~1160 wide); keep cats at a low tree
  // index so they sit inside the tile rather than being culled past its edge.
  { id: 'slc-east', tile: 1, treeIndex: 2 },       // walk right one block (~x780)
  { id: 'slc-west', tile: -1, treeIndex: 2 },      // walk left one block (~x780)
  { id: 'slc-far-east', tile: 3, treeIndex: 2 },   // farther east
];

function tileRand(tile: number, salt: string) {
  let h = tile * 2654435761;
  for (let i = 0; i < salt.length; i++) h = Math.imul(h ^ salt.charCodeAt(i), 2246822519);
  return ((h >>> 0) % 10000) / 10000;
}

function makeCat(tile: number, treeIndex: number, id: string): TreeCatPlacement {
  const side = tileRand(tile, `slc-side-${treeIndex}`) > 0.5 ? 1 : -1;
  const offset = side * (52 + tileRand(tile, `slc-off-${treeIndex}`) * 28);

  return {
    id,
    x: GROUND_TREE_XS[treeIndex] + offset,
    scale: 0.34 + tileRand(tile, `slc-s-${treeIndex}`) * 0.08,
    flip: side < 0,
  };
}

/** Cats for one ground tile (only where a fixed spot exists). */
export function catsForTile(tile: number): TreeCatPlacement[] {
  return CAT_SPOTS
    .filter(spot => spot.tile === tile)
    .map(spot => makeCat(spot.tile, spot.treeIndex, spot.id));
}
