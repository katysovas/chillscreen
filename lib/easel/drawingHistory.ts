import { requireDb } from '@/lib/db';
import { easelStageLookupSlugs, normalizeEaselStage } from './stageKey';

export type EaselDrawingHistory = {
  topics: string[];
  drawingIds: string[];
};

/** Past easel subjects for this NPC on a stage — includes hidden rows. */
export async function fetchEaselDrawingHistory(
  stage: string,
  npc: string,
  limit = 20,
): Promise<EaselDrawingHistory> {
  const stageKey = normalizeEaselStage(stage);
  const slugs = easelStageLookupSlugs(stageKey);
  const sql = requireDb();
  const rows = await sql`
    SELECT topic, drawing_id
    FROM easel
    WHERE stage = ANY(${slugs}) AND npc = ${npc}
    ORDER BY started_at DESC
    LIMIT ${limit}
  ` as { topic: string | null; drawing_id: string }[];

  const topics: string[] = [];
  const drawingIds: string[] = [];
  for (const row of rows) {
    if (row.drawing_id) drawingIds.push(row.drawing_id);
    const t = row.topic?.trim();
    if (t) topics.push(t);
  }
  return { topics, drawingIds };
}

export function normalizeTopicKey(topic: string): string {
  return topic.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function isDuplicateTopic(topic: string, priorTopics: string[]): boolean {
  const key = normalizeTopicKey(topic);
  if (!key) return false;
  return priorTopics.some(p => {
    const pk = normalizeTopicKey(p);
    return pk === key || pk.includes(key) || key.includes(pk);
  });
}

export function isDuplicateDrawingId(drawingId: string, priorIds: string[]): boolean {
  return priorIds.includes(drawingId);
}
