import type { MatchupTrack } from '@/lib/matchup/types';
import { youtubeThumbnailUrl } from '@/lib/stagePlaylistUtils';
import type { StageVideo } from '@/lib/stageVideos';

/** Video frame or stored channel avatar for Discord embeds. */
export function announceThumbnailFromVideoId(videoId: string | undefined | null): string | undefined {
  const id = videoId?.trim();
  return id ? youtubeThumbnailUrl(id) : undefined;
}

export function announceThumbnailFromStageVideo(video: StageVideo | undefined | null): string | undefined {
  if (!video) return undefined;
  const stored = video.thumbnailUrl?.trim();
  if (stored) return stored;
  return announceThumbnailFromVideoId(video.id);
}

export function announceThumbnailFromMatchupTrack(track: MatchupTrack | undefined | null): string | undefined {
  if (!track) return undefined;
  return announceThumbnailFromVideoId(track.youtubeId);
}
