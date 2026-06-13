import { requireDb } from '@/lib/db';
import { npcPoolKey } from './drawingsPool';
import { buildEaselDrawingContext } from './drawingContext';
import { generateDrawingProgram } from './generateDrawing';
import { programFromRow, rowToSlotSync } from './resolveProgram';
import { totalSegments } from './segments';
import type { DrawingProgram, EaselRow, EaselStatus } from './types';
import { EASEL_DEFAULT_RATE, EASEL_SLOTS_PER_STAGE } from './types';

const DEFAULT_CINEMA_NPCS = ['gen-cinema-vanessa'];

function rowFromDb(r: Record<string, unknown>): EaselRow {
  let programJson: DrawingProgram | null = null;
  const raw = r.program_json;
  if (raw && typeof raw === 'object') {
    programJson = raw as DrawingProgram;
  } else if (typeof raw === 'string') {
    try {
      programJson = JSON.parse(raw) as DrawingProgram;
    } catch {
      programJson = null;
    }
  }

  return {
    stage: String(r.stage),
    slot: Number(r.slot),
    npc: String(r.npc),
    drawing_id: String(r.drawing_id),
    total_segments: Number(r.total_segments),
    segments_done: Number(r.segments_done),
    rate: Number(r.rate),
    status: r.status as EaselStatus,
    started_at: String(r.started_at),
    completed_at: r.completed_at != null ? String(r.completed_at) : null,
    hidden_at: r.hidden_at != null ? String(r.hidden_at) : null,
    topic: r.topic != null ? String(r.topic) : null,
    program_json: programJson,
  };
}

export async function getEaselsForStage(stage: string): Promise<EaselRow[]> {
  const sql = requireDb();
  const rows = await sql`
    SELECT * FROM easel
    WHERE stage = ${stage} AND hidden_at IS NULL AND slot < ${EASEL_SLOTS_PER_STAGE}
    ORDER BY slot
  ` as Record<string, unknown>[];
  return rows.map(rowFromDb);
}

async function insertEaselRow(
  stage: string,
  slot: number,
  npc: string,
  drawingId: string,
  topic: string,
  program: DrawingProgram,
  totalSeg: number,
): Promise<void> {
  const sql = requireDb();
  await sql`
    INSERT INTO easel (stage, slot, npc, drawing_id, topic, program_json, total_segments, segments_done, rate, status)
    VALUES (
      ${stage}, ${slot}, ${npc}, ${drawingId}, ${topic},
      ${JSON.stringify(program)}::jsonb,
      ${totalSeg}, 0, ${EASEL_DEFAULT_RATE}, 'painting'
    )
    ON CONFLICT (stage, slot) DO NOTHING
  `;
}

async function createAiDrawingForNpc(stage: string, slot: number, npc: string): Promise<void> {
  const ctx = buildEaselDrawingContext(npc, stage);
  const { program, totalSegments: total } = await generateDrawingProgram(ctx);
  await insertEaselRow(stage, slot, npc, program.id, program.topic, program, total);
}

/** Seed one slot when a stage has no easel rows yet — AI picks the subject. */
export async function ensureEaselsForStage(stage: string): Promise<EaselRow[]> {
  let rows = await getEaselsForStage(stage);
  if (rows.length > 0) {
    return rows.map(row => {
      if (programFromRow(row)) return row;
      return row;
    });
  }

  for (let slot = 0; slot < EASEL_SLOTS_PER_STAGE; slot++) {
    const npc = DEFAULT_CINEMA_NPCS[slot];
    if (!npc) continue;
    await createAiDrawingForNpc(stage, slot, npc);
  }

  rows = await getEaselsForStage(stage);
  return rows;
}

export async function checkpointEasel(
  stage: string,
  slot: number,
  segmentsDone: number,
): Promise<EaselRow | null> {
  const sql = requireDb();
  await sql`
    UPDATE easel
    SET segments_done = ${segmentsDone},
        started_at = now()
    WHERE stage = ${stage} AND slot = ${slot} AND status = 'painting'
  `;
  return getEaselRow(stage, slot);
}

export async function completeEasel(stage: string, slot: number): Promise<EaselRow | null> {
  const sql = requireDb();
  await sql`
    UPDATE easel
    SET status = 'done',
        completed_at = now(),
        segments_done = total_segments,
        started_at = now()
    WHERE stage = ${stage} AND slot = ${slot}
  `;
  return getEaselRow(stage, slot);
}

export async function rolloverEasel(
  stage: string,
  slot: number,
  npc: string,
  drawingId: string,
  totalSegmentsCount: number,
): Promise<void> {
  const sql = requireDb();
  await sql`
    UPDATE easel
    SET drawing_id = ${drawingId},
        total_segments = ${totalSegmentsCount},
        segments_done = 0,
        status = 'painting',
        started_at = now(),
        completed_at = null
    WHERE stage = ${stage} AND slot = ${slot} AND npc = ${npc}
  `;
}

export async function hideEasel(stage: string, slot: number): Promise<void> {
  const sql = requireDb();
  await sql`
    UPDATE easel SET hidden_at = now() WHERE stage = ${stage} AND slot = ${slot}
  `;
}

export async function getEaselRow(stage: string, slot: number): Promise<EaselRow | null> {
  const sql = requireDb();
  const rows = await sql`
    SELECT * FROM easel WHERE stage = ${stage} AND slot = ${slot}
  ` as Record<string, unknown>[];
  return rows[0] ? rowFromDb(rows[0]) : null;
}

/** Start a fresh AI drawing on a slot (after hide or admin reset). */
export async function startNewEaselDrawing(stage: string, slot: number, npc: string): Promise<EaselRow | null> {
  const ctx = buildEaselDrawingContext(npc, stage);
  const { program, totalSegments: total } = await generateDrawingProgram(ctx);
  const sql = requireDb();
  await sql`
    INSERT INTO easel (stage, slot, npc, drawing_id, topic, program_json, total_segments, segments_done, rate, status)
    VALUES (
      ${stage}, ${slot}, ${npc}, ${program.id}, ${program.topic},
      ${JSON.stringify(program)}::jsonb,
      ${total}, 0, ${EASEL_DEFAULT_RATE}, 'painting'
    )
    ON CONFLICT (stage, slot) DO UPDATE SET
      npc = EXCLUDED.npc,
      drawing_id = EXCLUDED.drawing_id,
      topic = EXCLUDED.topic,
      program_json = EXCLUDED.program_json,
      total_segments = EXCLUDED.total_segments,
      segments_done = 0,
      rate = EXCLUDED.rate,
      status = 'painting',
      started_at = now(),
      completed_at = null,
      hidden_at = null
  `;
  return getEaselRow(stage, slot);
}

export { rowToSlotSync, programFromRow };
