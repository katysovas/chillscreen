/** Live camera offset — same space as ground scroll (GND_F = 1). Updated every game frame. */
export const gameWorldOffRef = { current: 0 };

export function worldXToScreenPct(worldX: number, worldOff: number, width = typeof window !== 'undefined' ? window.innerWidth : 1200) {
  return 50 + ((worldX - worldOff) / width) * 100;
}
