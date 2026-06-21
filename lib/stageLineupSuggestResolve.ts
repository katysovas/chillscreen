import { parseYoutubeVideoId } from './youtubeApi';
import type { StageVideo } from './stageVideos';
import type { StageVideoDisplayMeta } from './stageVideoMeta';

export function parseLineupSuggestionYoutubeId(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  return parseYoutubeVideoId(trimmed);
}

export async function resolveLineupSuggestionInput(
  input: string,
): Promise<{ video: StageVideo; meta?: StageVideoDisplayMeta } | null> {
  const videoId = parseLineupSuggestionYoutubeId(input);
  if (!videoId) return null;

  const res = await fetch(`/api/stage/video-meta?ids=${encodeURIComponent(videoId)}`);
  if (res.ok) {
    const data = await res.json() as { videos?: Record<string, StageVideoDisplayMeta> };
    const meta = data.videos?.[videoId];
    if (meta) {
      return {
        video: {
          id: videoId,
          title: meta.videoTitle,
          channelTitle: meta.channelTitle,
          thumbnailUrl: meta.avatarUrl,
          channelUrl: meta.channelUrl,
        },
        meta,
      };
    }
  }

  return {
    video: { id: videoId, title: input.trim() },
  };
}
