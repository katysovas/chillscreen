import { requireDb } from '@/lib/db';
import type { VenueCanvasStroke } from './types';

export async function getVenueCanvas(stageSlug: string): Promise<VenueCanvasStroke[]> {
  const sql = requireDb();
  const rows = await sql`
    SELECT strokes FROM venue_canvases WHERE stage_slug = ${stageSlug}
  ` as { strokes: VenueCanvasStroke[] }[];
  return rows[0]?.strokes ?? [];
}

export async function upsertVenueCanvas(
  stageSlug: string,
  strokes: VenueCanvasStroke[],
): Promise<void> {
  const sql = requireDb();
  await sql`
    INSERT INTO venue_canvases (stage_slug, strokes, updated_at)
    VALUES (${stageSlug}, ${JSON.stringify(strokes)}::jsonb, now())
    ON CONFLICT (stage_slug) DO UPDATE
      SET strokes = EXCLUDED.strokes,
          updated_at = now()
  `;
}
