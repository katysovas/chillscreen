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

/** Extract playlist id from a YouTube URL (`list=` query param). */
export function parseYoutubePlaylistId(input: string): string | null {
  const trimmed = input.trim();
  if (/^PL[\w-]{10,}$/.test(trimmed) || /^UU[\w-]{10,}$/.test(trimmed) || /^OLAK[\w_-]+$/.test(trimmed)) {
    return trimmed;
  }
  try {
    const url = trimmed.startsWith('http') ? new URL(trimmed) : new URL(`https://${trimmed}`);
    if (!url.hostname.includes('youtube.com') && !url.hostname.includes('youtu.be')) return null;
    const list = url.searchParams.get('list');
    return list && list.length >= 10 ? list : null;
  } catch {
    return null;
  }
}

export type YoutubeChannelRef =
  | { kind: 'id'; channelId: string }
  | { kind: 'handle'; handle: string };

/** Channel URL, @handle, or bare UC… channel id. */
export function parseYoutubeChannelRef(input: string): YoutubeChannelRef | null {
  const trimmed = input.trim();
  if (/^UC[\w-]{22}$/.test(trimmed)) return { kind: 'id', channelId: trimmed };
  if (trimmed.startsWith('@')) {
    const handle = trimmed.slice(1).replace(/\/$/, '');
    return handle ? { kind: 'handle', handle } : null;
  }
  try {
    const url = trimmed.startsWith('http') ? new URL(trimmed) : new URL(`https://${trimmed}`);
    if (!url.hostname.includes('youtube.com')) return null;
    const channelMatch = url.pathname.match(/^\/channel\/(UC[\w-]{22})/);
    if (channelMatch?.[1]) return { kind: 'id', channelId: channelMatch[1] };
    const handleMatch = url.pathname.match(/^\/@([\w.-]+)/);
    if (handleMatch?.[1]) return { kind: 'handle', handle: handleMatch[1] };
  } catch {
    /* invalid URL */
  }
  return null;
}

/** Ordered video ids from a playlist (public playlists only). */
export async function fetchYoutubePlaylistVideoIds(
  playlistId: string,
  apiKey: string,
  maxResults: number,
): Promise<string[]> {
  const ids: string[] = [];
  let pageToken: string | undefined;

  while (ids.length < maxResults) {
    const listUrl = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    listUrl.searchParams.set('part', 'contentDetails');
    listUrl.searchParams.set('playlistId', playlistId);
    listUrl.searchParams.set('maxResults', String(Math.min(50, maxResults - ids.length)));
    listUrl.searchParams.set('key', apiKey);
    if (pageToken) listUrl.searchParams.set('pageToken', pageToken);

    const res = await fetch(listUrl);
    if (!res.ok) {
      throw new Error(`YouTube playlist failed: ${res.status} ${await res.text()}`);
    }

    const data = await res.json() as {
      items?: { contentDetails?: { videoId?: string } }[];
      nextPageToken?: string;
    };

    for (const item of data.items ?? []) {
      const videoId = item.contentDetails?.videoId;
      if (videoId && /^[\w-]{11}$/.test(videoId)) ids.push(videoId);
    }

    pageToken = data.nextPageToken;
    if (!pageToken || (data.items ?? []).length === 0) break;
  }

  return ids;
}

/** Uploads playlist id for a channel (@handle or UC… id). */
export async function fetchYoutubeChannelUploadsPlaylistId(
  ref: YoutubeChannelRef,
  apiKey: string,
): Promise<string> {
  const channelsUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
  channelsUrl.searchParams.set('part', 'contentDetails');
  channelsUrl.searchParams.set('key', apiKey);
  if (ref.kind === 'id') {
    channelsUrl.searchParams.set('id', ref.channelId);
  } else {
    channelsUrl.searchParams.set('forHandle', ref.handle);
  }

  const res = await fetch(channelsUrl);
  if (!res.ok) {
    throw new Error(`YouTube channel failed: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as {
    items?: { contentDetails?: { relatedPlaylists?: { uploads?: string } } }[];
  };

  const playlistId = data.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!playlistId) throw new Error('Channel not found or has no public uploads.');
  return playlistId;
}

/** Recent uploads from a channel — newest first. */
export async function fetchYoutubeChannelVideoIds(
  ref: YoutubeChannelRef,
  apiKey: string,
  maxResults: number,
): Promise<string[]> {
  const uploadsPlaylistId = await fetchYoutubeChannelUploadsPlaylistId(ref, apiKey);
  return fetchYoutubePlaylistVideoIds(uploadsPlaylistId, apiKey, maxResults);
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

export type YoutubeVideoDisplayMeta = {
  videoId: string;
  videoTitle: string;
  channelTitle: string;
  avatarUrl: string;
  /** YouTube channel page — from channel id or oEmbed author_url. */
  channelUrl?: string;
};

const YOUTUBE_VIDEO_ID_RE = /^[\w-]{11}$/;

/** Channel avatar + uploader name for curated lineup rows. */
export async function fetchYoutubeVideoDisplayMeta(
  ids: string[],
  apiKey?: string,
): Promise<Map<string, YoutubeVideoDisplayMeta>> {
  const unique = [...new Set(ids.filter(id => YOUTUBE_VIDEO_ID_RE.test(id)))];
  const out = new Map<string, YoutubeVideoDisplayMeta>();
  if (!unique.length) return out;

  const pending = new Set(unique);

  if (apiKey) {
    for (let i = 0; i < unique.length; i += 50) {
      const batch = unique.slice(i, i + 50);
      try {
        const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
        detailsUrl.searchParams.set('part', 'snippet');
        detailsUrl.searchParams.set('id', batch.join(','));
        detailsUrl.searchParams.set('key', apiKey);

        const detailsRes = await fetch(detailsUrl);
        if (!detailsRes.ok) throw new Error(String(detailsRes.status));

        const detailsData = await detailsRes.json() as {
          items?: {
            id: string;
            snippet?: {
              title?: string;
              channelTitle?: string;
              channelId?: string;
              thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
            };
          }[];
        };

        type VideoRow = {
          id: string;
          channelId?: string;
          channelTitle: string;
          videoTitle: string;
          videoThumb: string;
        };

        const rows: VideoRow[] = [];
        const channelIds = new Set<string>();

        for (const item of detailsData.items ?? []) {
          const snippet = item.snippet;
          if (!snippet) continue;
          const videoTitle = snippet.title?.trim() || item.id;
          const channelTitle = snippet.channelTitle?.trim() || videoTitle;
          const videoThumb =
            snippet.thumbnails?.medium?.url
            ?? snippet.thumbnails?.default?.url
            ?? `https://i.ytimg.com/vi/${item.id}/mqdefault.jpg`;
          if (snippet.channelId) channelIds.add(snippet.channelId);
          rows.push({
            id: item.id,
            channelId: snippet.channelId,
            channelTitle,
            videoTitle,
            videoThumb,
          });
        }

        const channelAvatars = new Map<string, string>();
        if (channelIds.size) {
          const channelsUrl = new URL('https://www.googleapis.com/youtube/v3/channels');
          channelsUrl.searchParams.set('part', 'snippet');
          channelsUrl.searchParams.set('id', [...channelIds].join(','));
          channelsUrl.searchParams.set('key', apiKey);

          const channelsRes = await fetch(channelsUrl);
          if (channelsRes.ok) {
            const channelsData = await channelsRes.json() as {
              items?: {
                id: string;
                snippet?: {
                  thumbnails?: { default?: { url?: string }; medium?: { url?: string } };
                };
              }[];
            };
            for (const channel of channelsData.items ?? []) {
              const avatar =
                channel.snippet?.thumbnails?.medium?.url
                ?? channel.snippet?.thumbnails?.default?.url;
              if (avatar) channelAvatars.set(channel.id, avatar);
            }
          }
        }

        for (const row of rows) {
          out.set(row.id, {
            videoId: row.id,
            videoTitle: row.videoTitle,
            channelTitle: row.channelTitle,
            avatarUrl: (row.channelId ? channelAvatars.get(row.channelId) : undefined) ?? row.videoThumb,
            ...(row.channelId ? { channelUrl: `https://www.youtube.com/channel/${row.channelId}` } : {}),
          });
          pending.delete(row.id);
        }
      } catch {
        /* oEmbed fallback below */
      }
    }
  }

  await Promise.all([...pending].map(async id => {
    try {
      const oembedUrl = new URL('https://www.youtube.com/oembed');
      oembedUrl.searchParams.set('url', `https://www.youtube.com/watch?v=${id}`);
      oembedUrl.searchParams.set('format', 'json');
      const res = await fetch(oembedUrl);
      if (!res.ok) return;
      const data = await res.json() as {
        title?: string;
        author_name?: string;
        author_url?: string;
        thumbnail_url?: string;
      };
      out.set(id, {
        videoId: id,
        videoTitle: data.title?.trim() || id,
        channelTitle: data.author_name?.trim() || data.title?.trim() || id,
        avatarUrl: data.thumbnail_url ?? `https://i.ytimg.com/vi/${id}/mqdefault.jpg`,
        ...(data.author_url?.trim() ? { channelUrl: data.author_url.trim() } : {}),
      });
    } catch {
      /* skip unavailable ids */
    }
  }));

  return out;
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
