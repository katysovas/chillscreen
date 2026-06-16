import type { UserStagePublic, StageStream, StagePresetId } from '@/lib/stages/types';
import type { StageStreamPasteMode } from '@/lib/stages/parseStream';
import type { SkyPeriod } from '@/lib/skyTimeOfDay';
import type { FestieOwner } from '@/lib/festie/types';

export type SlugCheckResult = {
  available: boolean;
  reason?: string;
};

export type ParseStreamResult =
  | { ok: true; stream: StageStream }
  | { ok: false; reason: string; message: string };

export type ParseStreamsBulkResult =
  | { ok: true; streams: StageStream[]; skipped: number; totalFound: number }
  | { ok: false; reason: string; message: string };

export type ParseStageStreamsResult = ParseStreamResult | ParseStreamsBulkResult;

export async function checkStageSlug(slug: string): Promise<SlugCheckResult> {
  const res = await fetch(`/api/stages/check-slug?slug=${encodeURIComponent(slug)}`);
  const data = await res.json() as SlugCheckResult & { error?: string };
  if (!res.ok) return { available: false, reason: data.error ?? 'Check failed' };
  return data;
}

export async function parseStageStreams(
  url: string,
  mode: StageStreamPasteMode,
  opts?: { existingVideoIds?: string[]; maxToAdd?: number },
): Promise<ParseStageStreamsResult> {
  const res = await fetch('/api/stages/parse-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      mode,
      existingVideoIds: opts?.existingVideoIds,
      maxToAdd: opts?.maxToAdd,
    }),
  });
  const data = await res.json() as ParseStageStreamsResult & { error?: string; message?: string };
  if (!res.ok) {
    const errBody = data as { message?: string; error?: string };
    return {
      ok: false,
      reason: 'error',
      message: errBody.message || errBody.error || 'Could not parse videos.',
    };
  }
  return data;
}

export async function parseStageStreamUrl(url: string): Promise<ParseStreamResult> {
  const result = await parseStageStreams(url, 'video');
  if (!result.ok) return result;
  if ('streams' in result) {
    return { ok: false, reason: 'error', message: 'Unexpected bulk response.' };
  }
  return result;
}

export type CreateStagePayload = {
  slug: string;
  displayName: string;
  preset: StagePresetId;
  sky?: SkyPeriod;
  streams: StageStream[];
  festie?: {
    name: string;
    password: string;
    preset: string;
    attributes?: { energy: number; friendliness: number; chattiness: number };
    topics?: string[];
    personality_notes?: string | null;
  };
};

export type CreateStageResponse = {
  stage: UserStagePublic;
  festie: FestieOwner;
  coins: number;
};

export async function createUserStage(payload: CreateStagePayload): Promise<CreateStageResponse> {
  const res = await fetch('/api/stages', {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json() as CreateStageResponse & { error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Could not create stage');
  return data;
}

export async function fetchUserStage(slug: string): Promise<UserStagePublic | null> {
  const res = await fetch(`/api/stages/${encodeURIComponent(slug)}`);
  if (res.status === 404) return null;
  const data = await res.json() as { stage?: UserStagePublic; error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Failed to load stage');
  return data.stage ?? null;
}

export async function fetchMyStage(): Promise<UserStagePublic | null> {
  const res = await fetch('/api/stages/me');
  if (res.status === 401) return null;
  const data = await res.json() as { stage?: UserStagePublic | null; error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Failed to load your stage');
  return data.stage ?? null;
}

export async function updateUserStage(
  slug: string,
  patch: {
    streams?: StageStream[];
    nowPlayingIndex?: number;
    preset?: StagePresetId;
    sky?: SkyPeriod | null;
  },
): Promise<UserStagePublic> {
  const res = await fetch(`/api/stages/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const data = await res.json() as { stage?: UserStagePublic; error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Update failed');
  return data.stage!;
}

export async function takedownUserStage(slug: string): Promise<void> {
  const res = await fetch(`/api/stages/${encodeURIComponent(slug)}`, { method: 'DELETE' });
  if (!res.ok) {
    const data = await res.json() as { error?: string };
    throw new Error(data.error ?? 'Takedown failed');
  }
}

export async function touchStagePresence(slug: string): Promise<void> {
  await fetch(`/api/stages/${encodeURIComponent(slug)}/presence`, { method: 'POST' });
}
