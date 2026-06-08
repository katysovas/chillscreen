import { fetchYoutubeSearchVideos } from './youtubeApi';
import {
  filterStageVideos,
  STAGE_CHANNEL_CONFIG,
  STAGE_PLAYLISTS,
  type StageChannel,
  type StageVideo,
} from './stageVideos';

const CACHE_TTL_MS = 60 * 60 * 1000;

/** Shared TTL for in-memory, Next.js data cache, and HTTP cache headers. */
export const STAGE_PLAYLIST_CACHE_SECONDS = CACHE_TTL_MS / 1000;

let cache: { playlists: Record<StageChannel, StageVideo[]>; fetchedAt: number } | null = null;

function clonePlaylists(): Record<StageChannel, StageVideo[]> {
  return Object.fromEntries(
    Object.entries(STAGE_PLAYLISTS).map(([channel, videos]) => [channel, [...videos]]),
  ) as Record<StageChannel, StageVideo[]>;
}

/**
 * Resolve every channel playlist. Curated channels pass through; `youtube-api`
 * channels are populated via YouTube Data API search (requires API key).
 */
export async function resolveStagePlaylists(apiKey?: string): Promise<Record<StageChannel, StageVideo[]>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) {
    return cache.playlists;
  }

  const playlists = clonePlaylists();

  if (apiKey) {
    await Promise.all(
      (Object.keys(STAGE_CHANNEL_CONFIG) as StageChannel[]).map(async channel => {
        const cfg = STAGE_CHANNEL_CONFIG[channel];
        if (cfg.source !== 'youtube-api') return;
        try {
          const videos = await fetchYoutubeSearchVideos(
            cfg.searchQuery,
            apiKey,
            cfg.maxResults ?? 20,
            cfg.excludeTitlePatterns,
          );
          if (videos.length > 0) {
            playlists[channel] = videos;
          }
        } catch (err) {
          console.error(`[stage] YouTube API playlist failed for ${channel}:`, err);
        }
      }),
    );
  }

  for (const channel of Object.keys(STAGE_CHANNEL_CONFIG) as StageChannel[]) {
    const { excludeTitlePatterns } = STAGE_CHANNEL_CONFIG[channel];
    playlists[channel] = filterStageVideos(playlists[channel], excludeTitlePatterns);
  }

  cache = { playlists, fetchedAt: Date.now() };
  return playlists;
}

/** Test helper — clears the in-memory resolver cache. */
export function clearStagePlaylistCache() {
  cache = null;
}
