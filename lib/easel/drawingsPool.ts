import type { DrawingsPoolFile, DrawingProgram, NpcDrawingPool } from './types';
import pool from '@/data/drawings.json';

const file = pool as unknown as DrawingsPoolFile;

/** Lookup key from character id — `gen-cinema-vanessa` → `vanessa`. */
export function npcPoolKey(characterId: string): string {
  const parts = characterId.split('-');
  return parts[parts.length - 1] ?? characterId;
}

export function getNpcPool(npcKey: string): NpcDrawingPool | null {
  return file.npcs[npcKey] ?? null;
}

export function getDrawingById(drawingId: string): DrawingProgram | null {
  for (const pool of Object.values(file.npcs)) {
    const d = pool.drawings.find(x => x.id === drawingId);
    if (d) return d;
  }
  return null;
}

export function getDrawingForNpc(npcKey: string, index = 0): DrawingProgram | null {
  const p = getNpcPool(npcKey);
  if (!p || p.drawings.length === 0) return null;
  return p.drawings[index % p.drawings.length] ?? null;
}

export function paletteForNpc(npcKey: string): string[] {
  return getNpcPool(npcKey)?.palette ?? ['#262017', '#6B6C6E', '#fdfcf8'];
}

export function modelLabelForNpc(npcKey: string): string {
  return getNpcPool(npcKey)?.model ?? 'npc';
}

export function allPoolKeys(): string[] {
  return Object.keys(file.npcs);
}

export { file as drawingsPoolFile };
