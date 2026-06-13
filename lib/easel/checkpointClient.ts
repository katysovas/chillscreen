export type EaselCheckpointResult = {
  segments_done: number;
  started_at: string;
  status: 'painting' | 'done';
};

export async function checkpointEaselProgress(
  stage: string,
  slot: number,
  segmentsDone: number,
): Promise<EaselCheckpointResult | null> {
  try {
    const res = await fetch('/api/easel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'checkpoint', stage, slot, segments_done: segmentsDone }),
      keepalive: true,
    });
    if (!res.ok) return null;
    const data = await res.json() as { ok?: boolean; segments_done?: number; started_at?: string; status?: string };
    if (!data.ok || data.segments_done == null || !data.started_at) return null;
    return {
      segments_done: data.segments_done,
      started_at: data.started_at,
      status: data.status === 'done' ? 'done' : 'painting',
    };
  } catch {
    return null;
  }
}

export async function completeEaselDrawing(
  stage: string,
  slot: number,
): Promise<EaselCheckpointResult | null> {
  try {
    const res = await fetch('/api/easel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'complete', stage, slot }),
      keepalive: true,
    });
    if (!res.ok) return null;
    const data = await res.json() as { ok?: boolean; segments_done?: number; started_at?: string; status?: string };
    if (!data.ok || data.segments_done == null || !data.started_at) return null;
    return {
      segments_done: data.segments_done,
      started_at: data.started_at,
      status: 'done',
    };
  } catch {
    return null;
  }
}
