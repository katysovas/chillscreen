/**
 * YouTube Data API v3 helpers — dependency-free for PartyKit + Next.js routes.
 */

export const MAX_USEFUL_DURATION_SEC = 8 * 60 * 60;

/** Parse ISO 8601 duration → seconds, or null for streams / overlong clips. */
export function parseYoutubeDuration(iso: string): number | null {
  if (!iso || iso === 'P0D' || iso === 'PT0S' || iso === 'PT') return null;
  const m = iso.match(/^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!m) return null;
  const [, d, h, min, s] = m.map(v => parseInt(v ?? '0', 10) || 0);
  const total = d * 86400 + h * 3600 + min * 60 + s;
  return total > 0 && total <= MAX_USEFUL_DURATION_SEC ? total : null;
}

export type YoutubeVideoMeta = {
  id: string;
  title: string;
  durationSec?: number;
};

type YoutubeVideoStatus = {
  embeddable?: boolean;
  privacyStatus?: string;
  uploadStatus?: string;
};

/** True when YouTube allows this video in a third-party iframe embed. */
export function isYoutubeVideoEmbeddable(status: YoutubeVideoStatus | undefined): boolean {
  if (!status) return false;
  if (status.uploadStatus && status.uploadStatus !== 'processed') return false;
  if (status.privacyStatus && status.privacyStatus !== 'public') return false;
  return status.embeddable !== false;
}

/** Search YouTube for videos and resolve titles + durations. */
export async function fetchYoutubeSearchVideos(
  query: string,
  apiKey: string,
  maxResults = 20,
): Promise<YoutubeVideoMeta[]> {
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('videoEmbeddable', 'true');
  searchUrl.searchParams.set('maxResults', String(Math.min(maxResults, 50)));
  searchUrl.searchParams.set('key', apiKey);

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    throw new Error(`YouTube search failed: ${searchRes.status} ${await searchRes.text()}`);
  }

  const searchData = await searchRes.json() as {
    items?: { id?: { videoId?: string }; snippet?: { title?: string } }[];
  };

  const ids = (searchData.items ?? [])
    .map(item => item.id?.videoId)
    .filter((id): id is string => Boolean(id));

  if (ids.length === 0) return [];

  const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  detailsUrl.searchParams.set('part', 'contentDetails,snippet,status');
  detailsUrl.searchParams.set('id', ids.join(','));
  detailsUrl.searchParams.set('key', apiKey);

  const detailsRes = await fetch(detailsUrl);
  if (!detailsRes.ok) {
    throw new Error(`YouTube videos failed: ${detailsRes.status} ${await detailsRes.text()}`);
  }

  const detailsData = await detailsRes.json() as {
    items?: {
      id: string;
      snippet?: { title?: string };
      contentDetails?: { duration?: string };
      status?: YoutubeVideoStatus;
    }[];
  };

  const byId = new Map(
    (detailsData.items ?? [])
      .filter(item => isYoutubeVideoEmbeddable(item.status))
      .map(item => {
        const durationSec = parseYoutubeDuration(item.contentDetails?.duration ?? '') ?? undefined;
        return [item.id, {
          id: item.id,
          title: item.snippet?.title?.trim() || item.id,
          durationSec,
        } satisfies YoutubeVideoMeta];
      }),
  );

  // Preserve search ranking order.
  const out: YoutubeVideoMeta[] = [];
  for (const id of ids) {
    const video = byId.get(id);
    if (video) out.push(video);
  }
  return out;
}
