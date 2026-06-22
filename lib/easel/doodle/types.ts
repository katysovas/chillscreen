/** NPC easel doodle — image-gen sprite path (npc-doodle-imagegen-spec). */

export type { DoodleSpriteProgram, DoodleRevealMode } from '@/lib/easel/types';

export const DOODLE_TRANSPARENT = -1;

export type DoodleGridFile = {
  w: number;
  h: number;
  palette: string[];
  bgHex: string;
  /** Palette indices per row; -1 = transparent. */
  rows: number[][];
};

export type DoodleManifestEntry = {
  id: string;
  npc: string;
  subject: string;
  grid: string;
  sprite: string;
  score: number;
  w: number;
  h: number;
};

export type DoodleManifestStage = {
  easels: DoodleManifestEntry[];
};

export type DoodleManifest = {
  cycle: string;
  stages: Record<string, DoodleManifestStage>;
};
