import type { UserStagePublic, StageStream, StagePresetId, FeaturedStageSummary } from '@/lib/stages/types';
import type { StageStreamPasteMode } from '@/lib/stages/parseStream';
import { stageStreamFromYoutubeSearch } from '@/lib/stages/parseStream';
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

export type YoutubeSearchResult = {
  id: string;
  title: string;
  thumbnailUrl: string;
  channelTitle?: string;
  embeddable: boolean;
  durationSec: number | null;
};

export async function searchStageYoutubeVideos(
  query: string,
  max = 20,
): Promise<{ results: YoutubeSearchResult[]; quotaExceeded?: boolean }> {
  const res = await fetch(
    `/api/stages/youtube-search?q=${encodeURIComponent(query)}&max=${max}`,
  );
  const data = await res.json() as {
    results?: YoutubeSearchResult[];
    error?: string;
    quotaExceeded?: boolean;
  };
  if (!res.ok) {
    const err = new Error(data.error ?? 'Search failed');
    (err as Error & { quotaExceeded?: boolean }).quotaExceeded = data.quotaExceeded;
    throw err;
  }
  return { results: data.results ?? [] };
}

export { stageStreamFromYoutubeSearch };

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
  description?: string | null;
  preset: StagePresetId;
  sky?: SkyPeriod;
  streams: StageStream[];
  backdropUrl?: string | null;
  shuffleOnStart?: boolean;
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

export async function fetchMyStages(): Promise<UserStagePublic[]> {
  const res = await fetch('/api/stages/me', { credentials: 'include' });
  if (res.status === 401) return [];
  const data = await res.json() as { stages?: UserStagePublic[]; stage?: UserStagePublic | null; error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Failed to load your stages');
  if (Array.isArray(data.stages)) return data.stages;
  return data.stage ? [data.stage] : [];
}

export async function fetchMyStage(): Promise<UserStagePublic | null> {
  const stages = await fetchMyStages();
  return stages[0] ?? null;
}

export async function uploadStageBackdrop(slug: string, file: File): Promise<UserStagePublic> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`/api/stages/${encodeURIComponent(slug)}/backdrop`, {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  const data = await res.json() as { stage?: UserStagePublic; error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Upload failed');
  return data.stage!;
}

export async function updateUserStage(
  slug: string,
  patch: {
    streams?: StageStream[];
    nowPlayingIndex?: number;
    preset?: StagePresetId;
    sky?: SkyPeriod | null;
    backdropUrl?: string | null;
    shuffleOnStart?: boolean;
    description?: string | null;
  },
): Promise<UserStagePublic> {
  const res = await fetch(`/api/stages/${encodeURIComponent(slug)}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(patch),
  });
  const data = await res.json() as { stage?: UserStagePublic; error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Update failed');
  return data.stage!;
}

export async function takedownUserStage(slug: string): Promise<void> {
  const res = await fetch(`/api/stages/${encodeURIComponent(slug)}`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const data = await res.json() as { error?: string };
    throw new Error(data.error ?? 'Takedown failed');
  }
}

export async function touchStagePresence(slug: string): Promise<void> {
  await fetch(`/api/stages/${encodeURIComponent(slug)}/presence`, { method: 'POST' });
}

export type ShuffleStartResult = {
  shuffled: boolean;
  stage: UserStagePublic;
};

export async function tryShuffleOnStageStart(slug: string): Promise<ShuffleStartResult | null> {
  const res = await fetch(`/api/stages/${encodeURIComponent(slug)}/shuffle-start`, {
    method: 'POST',
  });
  if (res.status === 404) return null;
  const data = await res.json() as ShuffleStartResult & { error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Shuffle failed');
  return data;
}

let featuredStagesCache: Promise<FeaturedStageSummary[]> | null = null;

export async function fetchFeaturedStages(): Promise<FeaturedStageSummary[]> {
  if (!featuredStagesCache) {
    featuredStagesCache = fetch('/api/stages/featured')
      .then(async res => {
        const data = await res.json() as { stages?: FeaturedStageSummary[]; error?: string };
        if (!res.ok) throw new Error(data.error ?? 'Failed to load featured stages');
        return data.stages ?? [];
      })
      .catch(err => {
        featuredStagesCache = null;
        throw err;
      });
  }
  return featuredStagesCache;
}
