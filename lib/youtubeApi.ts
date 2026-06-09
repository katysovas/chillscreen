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

/** Admin search result — includes thumbnail and embed hints. */
export type YoutubeAdminSearchResult = Omit<YoutubeVideoMeta, 'durationSec'> & {
  thumbnailUrl: string;
  channelTitle?: string;
  embeddable: boolean;
  durationSec: number | null;
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

import { filterStageVideos, mergeExcludePatterns } from './stageVideos';

/** Search YouTube for videos and resolve titles + durations. */
export async function fetchYoutubeSearchVideos(
  query: string,
  apiKey: string,
  maxResults = 20,
  excludeTitlePatterns?: string[],
): Promise<YoutubeVideoMeta[]> {
  // Over-fetch when exclusions may thin the list.
  const hasExclusions = mergeExcludePatterns(excludeTitlePatterns).length > 0;
  const fetchCount = Math.min(
    50,
    hasExclusions ? Math.max(maxResults * 2, maxResults + 10) : maxResults,
  );

  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('videoEmbeddable', 'true');
  searchUrl.searchParams.set('maxResults', String(fetchCount));
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

  // Preserve search ranking order — skip open-ended live streams (no fixed duration).
  const out: YoutubeVideoMeta[] = [];
  for (const id of ids) {
    const video = byId.get(id);
    if (video?.durationSec) out.push(video);
  }
  return filterStageVideos(out, excludeTitlePatterns).slice(0, maxResults);
}

/** Extract a video id from a URL or bare id string. */
export function parseYoutubeVideoId(input: string): string | null {
  const trimmed = input.trim();
  if (/^[\w-]{11}$/.test(trimmed)) return trimmed;
  try {
    const url = trimmed.startsWith('http') ? new URL(trimmed) : new URL(`https://${trimmed}`);
    if (url.hostname === 'youtu.be') {
      const id = url.pathname.replace(/^\//, '').split('/')[0];
      return id && /^[\w-]{11}$/.test(id) ? id : null;
    }
    if (url.hostname.includes('youtube.com') || url.hostname.includes('youtube-nocookie.com')) {
      const fromQuery = url.searchParams.get('v');
      if (fromQuery && /^[\w-]{11}$/.test(fromQuery)) return fromQuery;
      const pathMatch = url.pathname.match(/\/(?:embed|shorts|live)\/([\w-]{11})/);
      if (pathMatch?.[1]) return pathMatch[1];
    }
  } catch {
    /* invalid URL */
  }
  return null;
}

function isYoutubeQuotaError(status: number, body: string): boolean {
  return status === 429 || (status === 403 && body.toLowerCase().includes('quota'));
}

async function fetchYoutubeVideosListDetails(
  ids: string[],
  apiKey: string,
): Promise<Map<string, YoutubeAdminSearchResult>> {
  if (ids.length === 0) return new Map();

  const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
  detailsUrl.searchParams.set('part', 'contentDetails,snippet,status');
  detailsUrl.searchParams.set('id', ids.join(','));
  detailsUrl.searchParams.set('key', apiKey);

  const detailsRes = await fetch(detailsUrl);
  if (!detailsRes.ok) {
    const body = await detailsRes.text();
    const err = new Error(`YouTube videos failed: ${detailsRes.status} ${body}`);
    (err as Error & { status?: number }).status = detailsRes.status;
    throw err;
  }

  const detailsData = await detailsRes.json() as {
    items?: {
      id: string;
      snippet?: {
        title?: string;
        channelTitle?: string;
        thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
      };
      contentDetails?: { duration?: string };
      status?: YoutubeVideoStatus;
    }[];
  };

  const out = new Map<string, YoutubeAdminSearchResult>();
  for (const item of detailsData.items ?? []) {
    const durationSec = parseYoutubeDuration(item.contentDetails?.duration ?? '');
    const thumb =
      item.snippet?.thumbnails?.medium?.url
      ?? item.snippet?.thumbnails?.default?.url
      ?? `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`;
    out.set(item.id, {
      id: item.id,
      title: item.snippet?.title?.trim() || item.id,
      channelTitle: item.snippet?.channelTitle,
      durationSec,
      thumbnailUrl: thumb,
      embeddable: isYoutubeVideoEmbeddable(item.status),
    });
  }
  return out;
}

/** Free metadata lookup — no API quota (no duration). */
export async function fetchYoutubeOembed(id: string): Promise<YoutubeAdminSearchResult> {
  const oembedUrl = new URL('https://www.youtube.com/oembed');
  oembedUrl.searchParams.set('url', `https://www.youtube.com/watch?v=${id}`);
  oembedUrl.searchParams.set('format', 'json');

  const res = await fetch(oembedUrl);
  if (!res.ok) {
    throw new Error(`Video not found or unavailable (${res.status})`);
  }

  const data = await res.json() as {
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
  };

  return {
    id,
    title: data.title?.trim() || id,
    channelTitle: data.author_name,
    durationSec: null,
    thumbnailUrl: data.thumbnail_url ?? `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
    embeddable: true,
  };
}

/**
 * Resolve one video by URL or id. Uses videos.list (1 quota unit) when possible,
 * then falls back to oEmbed when detail quota is exhausted or key is missing.
 */
export async function resolveAdminYoutubeVideo(
  input: string,
  apiKey?: string,
): Promise<YoutubeAdminSearchResult & { metaSource: 'api' | 'oembed' }> {
  const id = parseYoutubeVideoId(input);
  if (!id) throw new Error('Could not parse a YouTube video id from that input');

  if (apiKey) {
    try {
      const map = await fetchYoutubeVideosListDetails([id], apiKey);
      const video = map.get(id);
      if (video) return { ...video, metaSource: 'api' };
      throw new Error('Video not found or not embeddable');
    } catch (err) {
      const status = (err as Error & { status?: number }).status;
      if (status !== 403 && status !== 429) throw err;
    }
  }

  const oembed = await fetchYoutubeOembed(id);
  return { ...oembed, metaSource: 'oembed' };
}

/** YouTube search for localhost admin — includes thumbnails and live/unknown lengths. */
export async function fetchYoutubeAdminSearch(
  query: string,
  apiKey: string,
  maxResults = 24,
): Promise<YoutubeAdminSearchResult[]> {
  const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
  searchUrl.searchParams.set('part', 'snippet');
  searchUrl.searchParams.set('type', 'video');
  searchUrl.searchParams.set('q', query);
  searchUrl.searchParams.set('videoEmbeddable', 'true');
  searchUrl.searchParams.set('maxResults', String(Math.min(50, maxResults)));
  searchUrl.searchParams.set('key', apiKey);

  const searchRes = await fetch(searchUrl);
  if (!searchRes.ok) {
    const body = await searchRes.text();
    const err = new Error(
      isYoutubeQuotaError(searchRes.status, body)
        ? 'YouTube search quota exceeded for today (100 searches/day). Paste a video URL below instead — that uses no search quota.'
        : `YouTube search failed: ${searchRes.status} ${body}`,
    );
    (err as Error & { quotaExceeded?: boolean }).quotaExceeded = isYoutubeQuotaError(searchRes.status, body);
    throw err;
  }

  const searchData = await searchRes.json() as {
    items?: {
      id?: { videoId?: string };
      snippet?: {
        title?: string;
        channelTitle?: string;
        thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
      };
    }[];
  };

  const items = searchData.items ?? [];
  const ids = items.map(item => item.id?.videoId).filter((id): id is string => Boolean(id));
  if (ids.length === 0) return [];

  const byId = await fetchYoutubeVideosListDetails(ids, apiKey);

  const out: YoutubeAdminSearchResult[] = [];
  for (const item of items) {
    const id = item.id?.videoId;
    if (!id) continue;
    const detail = byId.get(id);
    if (!detail) continue;
    out.push(detail);
  }
  return out;
}
