/** Deterministic stipple reveal order — outline first, then interior shuffle. */

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(a: number): () => number {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleIndices(indices: number[], seed: string): number[] {
  const order = [...indices];
  const rand = mulberry32(hashSeed(seed));
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j]!, order[i]!];
  }
  return order;
}

/** Legacy random stipple — kept for tests / explicit opt-in. */
export function stippleRevealOrder(w: number, h: number, seed: string): number[] {
  const count = w * h;
  return shuffleIndices(Array.from({ length: count }, (_, i) => i), seed);
}

/** Perimeter cells first (outline), then shuffled interior — reads as sketching. */
export function outlineFirstStippleOrder(w: number, h: number, seed: string): number[] {
  const perimeter: number[] = [];
  const interior: number[] = [];
  const count = w * h;

  for (let i = 0; i < count; i++) {
    const col = i % w;
    const row = Math.floor(i / w);
    const isEdge = row === 0 || row === h - 1 || col === 0 || col === w - 1;
    if (isEdge) perimeter.push(i);
    else interior.push(i);
  }

  return [
    ...shuffleIndices(perimeter, `${seed}:edge`),
    ...shuffleIndices(interior, `${seed}:in`),
  ];
}

export function bandRevealOrder(bands = 12): number[] {
  return Array.from({ length: bands }, (_, i) => i);
}

export function revealOrderForProgram(
  id: string,
  w: number,
  h: number,
  mode: 'stipple' | 'band',
): number[] {
  if (mode === 'band') return bandRevealOrder();
  return outlineFirstStippleOrder(w, h, id);
}
