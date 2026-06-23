import type { StageVideo } from '@/lib/stageVideos';

export type MatchupStreamerBucket = {
  id: string;
  name?: string;
  videos: StageVideo[];
};

export type MatchupStageConfig = {
  streamers: MatchupStreamerBucket[];
};

type LegacyMatchupConfig = {
  streamers: {
    a?: MatchupStreamerBucket;
    b?: MatchupStreamerBucket;
  };
};

/** Normalize legacy `{ a, b }` objects and array configs from JSON. */
export function normalizeMatchupConfig(raw: unknown): MatchupStageConfig | null {
  if (!raw || typeof raw !== 'object') return null;
  const entry = raw as Record<string, unknown>;

  if (Array.isArray(entry.streamers)) {
    const streamers = (entry.streamers as MatchupStreamerBucket[])
      .filter(s => s && typeof s === 'object')
      .map((s, index) => ({
        id: (s.id?.trim() || `streamer-${index + 1}`),
        ...(s.name?.trim() ? { name: s.name.trim() } : {}),
        videos: Array.isArray(s.videos) ? s.videos : [],
      }));
    return streamers.length ? { streamers } : null;
  }

  const legacy = entry.streamers as LegacyMatchupConfig['streamers'] | undefined;
  if (legacy && typeof legacy === 'object' && !Array.isArray(legacy)) {
    const streamers: MatchupStreamerBucket[] = [];
    for (const key of ['a', 'b'] as const) {
      const bucket = legacy[key];
      if (!bucket) continue;
      streamers.push({
        id: key,
        ...(bucket.name?.trim() ? { name: bucket.name.trim() } : {}),
        videos: Array.isArray(bucket.videos) ? bucket.videos : [],
      });
    }
    return streamers.length ? { streamers } : null;
  }

  return null;
}

/** All videos from matchup streamer buckets (deduped, bucket order). */
export function flattenMatchupVideos(matchup: MatchupStageConfig): StageVideo[] {
  const seen = new Set<string>();
  const out: StageVideo[] = [];
  for (const streamer of matchup.streamers) {
    for (const video of streamer.videos) {
      if (seen.has(video.id)) continue;
      seen.add(video.id);
      out.push(video);
    }
  }
  return out;
}
