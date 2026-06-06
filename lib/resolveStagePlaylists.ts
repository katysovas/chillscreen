import { fetchYoutubeSearchVideos } from './youtubeApi';
import {
  STAGE_CHANNEL_CONFIG,
  STAGE_PLAYLISTS,
  type StageChannel,
  type StageVideo,
} from './stageVideos';

const CACHE_TTL_MS = 60 * 60 * 1000;

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

  cache = { playlists, fetchedAt: Date.now() };
  return playlists;
}

/** Test helper — clears the in-memory resolver cache. */
export function clearStagePlaylistCache() {
  cache = null;
}
