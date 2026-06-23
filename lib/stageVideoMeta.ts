import type { YoutubeVideoDisplayMeta } from './youtubeApi';
import type { StageVideo } from './stageVideos';
import { youtubeThumbnailUrl } from './stagePlaylistUtils';

export type StageVideoDisplayMeta = YoutubeVideoDisplayMeta;

export function resolveStageVideoDisplayMeta(
  video: StageVideo,
  fetched?: StageVideoDisplayMeta,
): StageVideoDisplayMeta {
  const videoTitle = fetched?.videoTitle?.trim() || video.title.trim();
  const channelTitle =
    fetched?.channelTitle?.trim()
    || video.channelTitle?.trim()
    || videoTitle;
  const avatarUrl =
    fetched?.avatarUrl
    || video.thumbnailUrl
    || youtubeThumbnailUrl(video.id);

  return {
    videoId: video.id,
    videoTitle,
    channelTitle,
    avatarUrl,
    channelUrl: fetched?.channelUrl?.trim() || video.channelUrl?.trim() || undefined,
    subscriberCount: fetched?.subscriberCount,
    channelDescription: fetched?.channelDescription?.trim() || undefined,
  };
}
