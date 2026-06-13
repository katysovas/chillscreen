import type { VenueCanvasStroke } from './types';

export async function fetchVenueCanvas(stageSlug: string): Promise<VenueCanvasStroke[]> {
  try {
    const res = await fetch(`/api/venue/canvas?slug=${encodeURIComponent(stageSlug)}`);
    if (!res.ok) return [];
    const data = await res.json() as { strokes: VenueCanvasStroke[] };
    return data.strokes ?? [];
  } catch {
    return [];
  }
}

export async function saveVenueCanvas(
  stageSlug: string,
  strokes: VenueCanvasStroke[],
): Promise<void> {
  try {
    await fetch('/api/venue/canvas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: stageSlug, strokes }),
    });
  } catch {
    // best-effort save
  }
}
