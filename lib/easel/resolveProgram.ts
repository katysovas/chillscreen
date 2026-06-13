import { getDrawingById } from './drawingsPool';
import type { DrawingProgram, EaselRow, EaselSlotSync } from './types';

export function programFromRow(row: EaselRow): DrawingProgram | null {
  if (row.program_json && typeof row.program_json === 'object') {
    const p = row.program_json as DrawingProgram;
    if (p.strokes?.length) return p;
  }
  return getDrawingById(row.drawing_id);
}

export function programForSlot(slot: EaselSlotSync): DrawingProgram | null {
  if (slot.program) return slot.program;
  return getDrawingById(slot.drawing_id);
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
  };
}
