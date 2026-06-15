import { requireDb } from '@/lib/db';
import { buildEaselDrawingContext } from './drawingContext';
import { generateDrawingProgram } from './generateDrawing';
import { easelHoldExpired, easelMaxVisibleExpired } from './lifecycle';
import { logEaselDrawing } from './logDrawing';
import { pickNextEaselNpc } from './npcRotation';
import { nextEaselSlot } from './stageAnchor';
import { programFromRow, rowNeedsAiUpgrade, rowToSlotSync } from './resolveProgram';
import { easelStageLookupSlugs, normalizeEaselStage } from './stageKey';
import { pickVisibleEaselSlot, pickVisibleEaselSlots } from './visibleSlots';
import type { DrawingProgram, EaselRow, EaselStatus } from './types';
import { EASEL_DEFAULT_RATE, EASEL_SLOTS_PER_STAGE } from './types';

async function migrateLegacyStageRows(rows: EaselRow[]): Promise<void> {
  const sql = requireDb();
  for (const row of rows) {
    const canonical = normalizeEaselStage(row.stage);
    if (row.stage === canonical) continue;
    await sql`
      UPDATE easel SET stage = ${canonical}
      WHERE stage = ${row.stage} AND slot = ${row.slot}
    `;
    row.stage = canonical;
  }
}

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

async function fetchVisibleEaselRows(stage: string): Promise<EaselRow[]> {
  const sql = requireDb();
  const slugs = easelStageLookupSlugs(stage);
  const rows = await sql`
    SELECT * FROM easel
    WHERE stage = ANY(${slugs}) AND hidden_at IS NULL AND slot < ${EASEL_SLOTS_PER_STAGE}
    ORDER BY slot
  ` as Record<string, unknown>[];
  const parsed = rows.map(rowFromDb);
  await migrateLegacyStageRows(parsed);
  return parsed;
}

export async function getEaselsForStage(stage: string): Promise<EaselRow[]> {
  return pickVisibleEaselSlots(await fetchVisibleEaselRows(stage));
}

/** Hide extra ambient easels so only one unprompted canvas shows per room. */
async function pruneExtraVisibleEasels(stage: string): Promise<void> {
  const rows = await fetchVisibleEaselRows(stage);
  const keep = pickVisibleEaselSlot(rows);
  if (!keep) return;
  for (const row of rows) {
    if (row.slot !== keep.slot) {
      await hideEasel(stage, row.slot);
    }
  }
}

async function createAiDrawingForNpc(stage: string, slot: number, npc: string): Promise<void> {
  await startNewEaselDrawing(stage, slot, npc);
}

function logExistingEaselRow(row: EaselRow, stage: string): void {
  const program = programFromRow(row);
  const topic = row.topic ?? program?.topic ?? row.drawing_id;
  logEaselDrawing('server', row.npc, topic, {
    stage,
    slot: row.slot,
    status: row.status,
    source: row.program_json ? 'ai-db' : 'missing',
    progress: `${row.segments_done}/${row.total_segments}`,
  });
}

async function upgradeEaselRowToAi(stage: string, row: EaselRow): Promise<EaselRow> {
  const stageKey = normalizeEaselStage(stage);
  console.log(
    `[easel:server] replacing legacy drawing "${row.drawing_id}" with AI program for ${row.npc}`,
  );
  const ctx = await buildEaselDrawingContext(row.npc, stageKey);
  const { program, totalSegments: total } = await generateDrawingProgram(ctx);
  const wasDone = row.status === 'done';
  const sql = requireDb();
  const slugs = easelStageLookupSlugs(stageKey);
  if (wasDone) {
    await sql`
      UPDATE easel SET
        stage = ${stageKey},
        drawing_id = ${program.id},
        topic = ${program.topic},
        program_json = ${JSON.stringify(program)}::jsonb,
        total_segments = ${total},
        segments_done = ${total},
        status = 'done',
        started_at = now()
      WHERE stage = ANY(${slugs}) AND slot = ${row.slot}
    `;
  } else {
    await sql`
      UPDATE easel SET
        stage = ${stageKey},
        drawing_id = ${program.id},
        topic = ${program.topic},
        program_json = ${JSON.stringify(program)}::jsonb,
        total_segments = ${total},
        segments_done = 0,
        status = 'painting',
        started_at = now(),
        completed_at = null
      WHERE stage = ANY(${slugs}) AND slot = ${row.slot}
    `;
  }
  const updated = await getEaselRow(stageKey, row.slot);
  if (!updated) throw new Error('easel upgrade failed');
  logExistingEaselRow(updated, stageKey);
  return updated;
}

/** Upgrade legacy rows without seeding or advancing holds. */
export async function getVisibleEasels(stage: string): Promise<EaselRow[]> {
  let rows = await fetchVisibleEaselRows(stage);
  for (const row of rows) {
    if (rowNeedsAiUpgrade(row)) {
      await upgradeEaselRowToAi(stage, row);
    }
  }
  rows = pickVisibleEaselSlots(await fetchVisibleEaselRows(stage));
  for (const row of rows) logExistingEaselRow(row, stage);
  return rows;
}

/** Upgrade legacy rows and advance finished easels past the hold window. */
export async function syncEaselSessionForPlayers(stage: string): Promise<EaselRow[]> {
  const stageKey = normalizeEaselStage(stage);
  await getVisibleEasels(stageKey);
  await pruneExtraVisibleEasels(stageKey);
  const rows = await fetchVisibleEaselRows(stageKey);
  for (const row of rows) {
    if (easelMaxVisibleExpired(row.started_at)) {
      await hideEasel(stageKey, row.slot);
      continue;
    }
    if (row.status === 'done' && easelHoldExpired(row.completed_at)) {
      await advanceEaselAfterHold(stageKey, row.slot);
    }
  }

  return getEaselsForStage(stageKey);
}

/**
 * Start the easel when a real user is present and no visible canvas exists.
 * Also advances any easels past the post-completion hold.
 */
export async function ensureEaselSessionStarted(stage: string): Promise<EaselRow[]> {
  const stageKey = normalizeEaselStage(stage);
  await syncEaselSessionForPlayers(stageKey);
  let rows = await getEaselsForStage(stageKey);
  if (rows.length === 0) {
    const npc = await pickNextEaselNpc(stageKey);
    console.log(`[easel:server] user session — ${npc} begins painting @ ${stageKey}`);
    await startNewEaselDrawing(stageKey, 0, npc);
    rows = await getEaselsForStage(stageKey);
  }
  for (const row of rows) logExistingEaselRow(row, stageKey);
  return rows;
}

/** After hold expires: hide finished canvas, next NPC starts a fresh painting. */
export async function advanceEaselAfterHold(stage: string, slot: number): Promise<EaselRow | null> {
  const row = await getEaselRow(stage, slot);
  if (!row || row.status !== 'done' || !easelHoldExpired(row.completed_at)) {
    return row;
  }

  const nextNpc = await pickNextEaselNpc(stage, row.npc);
  const nextSlot = nextEaselSlot(slot);
  console.log(
    `[easel:server] hold ended — hiding slot ${slot}, ${nextNpc} starts @ slot ${nextSlot} (${stage})`,
  );
  await hideEasel(stage, slot);
  return startNewEaselDrawing(stage, nextSlot, nextNpc);
}

/** @deprecated Use ensureEaselSessionStarted when users are present, or getEaselsForStage for read-only. */
export async function ensureEaselsForStage(stage: string): Promise<EaselRow[]> {
  return ensureEaselSessionStarted(stage);
}

export async function checkpointEasel(
  stage: string,
  slot: number,
  segmentsDone: number,
): Promise<EaselRow | null> {
  const stageKey = normalizeEaselStage(stage);
  const slugs = easelStageLookupSlugs(stageKey);
  const sql = requireDb();
  await sql`
    UPDATE easel
    SET segments_done = ${segmentsDone},
        stage = ${stageKey},
        started_at = now()
    WHERE stage = ANY(${slugs}) AND slot = ${slot} AND status = 'painting'
  `;
  return getEaselRow(stageKey, slot);
}

export async function completeEasel(stage: string, slot: number): Promise<EaselRow | null> {
  const stageKey = normalizeEaselStage(stage);
  const slugs = easelStageLookupSlugs(stageKey);
  const sql = requireDb();
  await sql`
    UPDATE easel
    SET status = 'done',
        stage = ${stageKey},
        completed_at = now(),
        segments_done = total_segments,
        started_at = now()
    WHERE stage = ANY(${slugs}) AND slot = ${slot}
  `;
  return getEaselRow(stageKey, slot);
}

export async function rolloverEasel(
  stage: string,
  slot: number,
  npc: string,
  drawingId: string,
  totalSegmentsCount: number,
): Promise<void> {
  const stageKey = normalizeEaselStage(stage);
  const slugs = easelStageLookupSlugs(stageKey);
  const sql = requireDb();
  await sql`
    UPDATE easel
    SET stage = ${stageKey},
        drawing_id = ${drawingId},
        total_segments = ${totalSegmentsCount},
        segments_done = 0,
        status = 'painting',
        started_at = now(),
        completed_at = null
    WHERE stage = ANY(${slugs}) AND slot = ${slot} AND npc = ${npc}
  `;
}

export async function hideEasel(stage: string, slot: number): Promise<void> {
  const stageKey = normalizeEaselStage(stage);
  const slugs = easelStageLookupSlugs(stageKey);
  const sql = requireDb();
  await sql`
    UPDATE easel SET hidden_at = now(), stage = ${stageKey}
    WHERE stage = ANY(${slugs}) AND slot = ${slot}
  `;
}

export async function getEaselRow(stage: string, slot: number): Promise<EaselRow | null> {
  const slugs = easelStageLookupSlugs(stage);
  const sql = requireDb();
  const rows = await sql`
    SELECT * FROM easel WHERE stage = ANY(${slugs}) AND slot = ${slot}
  ` as Record<string, unknown>[];
  if (!rows[0]) return null;
  const row = rowFromDb(rows[0]);
  await migrateLegacyStageRows([row]);
  return row;
}

/** Start a fresh AI drawing on a slot (after hide or admin reset). */
export async function startNewEaselDrawing(stage: string, slot: number, npc: string): Promise<EaselRow | null> {
  const stageKey = normalizeEaselStage(stage);
  console.log(`[easel:server] starting fresh drawing for ${npc} @ ${stageKey} slot ${slot}`);
  const ctx = await buildEaselDrawingContext(npc, stageKey);
  const { program, totalSegments: total } = await generateDrawingProgram(ctx);
  const sql = requireDb();
  await sql`
    INSERT INTO easel (stage, slot, npc, drawing_id, topic, program_json, total_segments, segments_done, rate, status)
    VALUES (
      ${stageKey}, ${slot}, ${npc}, ${program.id}, ${program.topic},
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
  return getEaselRow(stageKey, slot);
}

export { rowToSlotSync, programFromRow };
