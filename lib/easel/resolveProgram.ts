import type { DrawingProgram, EaselArtProgram, EaselRow, EaselSlotSync } from './types';
import { isDoodleSpriteProgram } from './doodle/program';

/** Strip heavy program payloads from wire sync — client resolves doodles from manifest. */
export function slimSlotForSync(slot: EaselSlotSync): EaselSlotSync {
  if (!isDoodleSpriteProgram(slot.program)) return slot;
  const { program: _program, ...rest } = slot;
  return {
    ...rest,
    program: {
      kind: 'doodle-sprite',
      id: _program.id,
      npc: _program.npc,
      model: _program.model,
      topic: _program.topic,
      gridPath: _program.gridPath,
      spritePath: _program.spritePath,
      w: _program.w,
      h: _program.h,
      palette: [],
      bgHex: _program.bgHex,
      revealMode: _program.revealMode,
    },
  };
}

export function hasStoredProgram(row: EaselRow | EaselSlotSync): boolean {
  const p = 'program_json' in row ? row.program_json : row.program;
  if (isDoodleSpriteProgram(p)) return true;
  return Boolean(p && typeof p === 'object' && Array.isArray((p as DrawingProgram).strokes) && (p as DrawingProgram).strokes.length > 0);
}

export function programFromRow(row: EaselRow): EaselArtProgram | null {
  if (isDoodleSpriteProgram(row.program_json)) return row.program_json;
  if (row.program_json && Array.isArray(row.program_json.strokes) && row.program_json.strokes.length > 0) {
    return row.program_json;
  }
  return null;
}

export function programForSlot(slot: EaselSlotSync): EaselArtProgram | null {
  if (isDoodleSpriteProgram(slot.program)) return slot.program;
  if (slot.program?.strokes?.length) return slot.program;
  return null;
}

export function strokeProgramForSlot(slot: EaselSlotSync): DrawingProgram | null {
  const p = programForSlot(slot);
  if (!p || isDoodleSpriteProgram(p)) return null;
  return p;
}

export function rowToSlotSync(row: EaselRow): EaselSlotSync {
  const program = programFromRow(row);
  return {
    slot: row.slot,
    npc: row.npc,
    drawing_id: row.drawing_id,
    total_segments: row.total_segments,
    segments_done: row.segments_done,
    rate: row.rate,
    status: row.status,
    started_at: row.started_at,
    topic: row.topic ?? program?.topic,
    program: program ?? undefined,
    completed_at: row.completed_at ?? undefined,
  };
}

/** True when row predates AI programs (drawings.json ids like vanessa_cat_01). */
export function rowNeedsAiUpgrade(row: EaselRow): boolean {
  return !hasStoredProgram(row);
}
