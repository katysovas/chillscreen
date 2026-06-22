import type { EaselSlotSync } from './types';
import { freshEaselFromUrl } from './freshEasel';

export type EaselCheckpointResult = {
  segments_done: number;
  started_at: string;
  status: 'painting' | 'done';
  completed_at?: string;
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
    const data = await res.json() as {
      ok?: boolean;
      segments_done?: number;
      started_at?: string;
      status?: string;
      completed_at?: string;
    };
    if (!data.ok || data.segments_done == null || !data.started_at) return null;
    return {
      segments_done: data.segments_done,
      started_at: data.started_at,
      status: 'done',
      completed_at: data.completed_at,
    };
  } catch {
    return null;
  }
}

export async function advanceEaselIfReady(
  stage: string,
  slot: number,
): Promise<EaselSlotSync | null> {
  try {
    const res = await fetch('/api/easel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'advanceIfReady', stage, slot }),
    });
    if (!res.ok) return null;
    const data = await res.json() as EaselSlotSync & { ok?: boolean; waiting?: boolean };
    if (!data.ok || data.waiting || !data.drawing_id) return null;
    return data;
  } catch {
    return null;
  }
}

export async function ensureEaselSession(stage: string): Promise<EaselSlotSync[]> {
  try {
    const freshEasel = freshEaselFromUrl();
    const res = await fetch('/api/easel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ensureSession', stage, freshEasel }),
    });
    if (!res.ok) return [];
    const data = await res.json() as { slots?: EaselSlotSync[] };
    return data.slots ?? [];
  } catch {
    return [];
  }
}
