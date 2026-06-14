import type { DrawingProgram, EaselRow, EaselSlotSync } from './types';

export function hasStoredProgram(row: EaselRow | EaselSlotSync): boolean {
  const p = 'program_json' in row ? row.program_json : row.program;
  return Boolean(p && typeof p === 'object' && Array.isArray((p as DrawingProgram).strokes) && (p as DrawingProgram).strokes.length > 0);
}

export function programFromRow(row: EaselRow): DrawingProgram | null {
  if (row.program_json && Array.isArray(row.program_json.strokes) && row.program_json.strokes.length > 0) {
    return row.program_json;
  }
  return null;
}

export function programForSlot(slot: EaselSlotSync): DrawingProgram | null {
  if (slot.program?.strokes?.length) return slot.program;
  return null;
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
