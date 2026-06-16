import {
  fetchYoutubeOembed,
  fetchYoutubeChannelVideoIds,
  fetchYoutubePlaylistVideoIds,
  isYoutubeVideoEmbeddable,
  parseYoutubeChannelRef,
  parseYoutubeDuration,
  parseYoutubePlaylistId,
  parseYoutubeVideoId,
} from '@/lib/youtubeApi';
import type { StageStream } from '@/lib/stages/types';

export type StageStreamPasteMode = 'video' | 'playlist' | 'channel';

export type StreamParseRejectReason =
  | 'invalid_url'
  | 'not_found'
  | 'not_embeddable'
  | 'age_restricted'
  | 'region_locked'
  | 'no_duration';

export type ParsedStageStream = StageStream;

export type StreamParseResult =
  | { ok: true; stream: ParsedStageStream }
  | { ok: false; reason: StreamParseRejectReason; message: string };

export type StreamBulkParseResult =
  | { ok: true; streams: ParsedStageStream[]; skipped: number; totalFound: number }
  | { ok: false; reason: StreamParseRejectReason | 'empty'; message: string };

function reject(reason: StreamParseRejectReason, message: string): StreamParseResult {
  return { ok: false, reason, message };
}

function rejectBulk(reason: StreamParseRejectReason | 'empty', message: string): StreamBulkParseResult {
  return { ok: false, reason, message };
}

type YoutubeVideoApiItem = {
  id: string;
  snippet?: { title?: string; channelTitle?: string; thumbnails?: { medium?: { url?: string } } };
  contentDetails?: { duration?: string; regionRestriction?: { blocked?: string[] } };
  status?: {
    embeddable?: boolean;
    privacyStatus?: string;
    uploadStatus?: string;
    contentRating?: { ytRating?: string };
  };
};

function stageStreamFromApiItem(item: YoutubeVideoApiItem): ParsedStageStream | null {
  const videoId = item.id;
  if (!videoId) return null;

  const status = item.status;
  if (status?.contentRating?.ytRating === 'ytAgeRestricted') return null;
  if (!isYoutubeVideoEmbeddable(status)) return null;
  if (item.contentDetails?.regionRestriction?.blocked?.length) return null;

  const durationSec = parseYoutubeDuration(item.contentDetails?.duration ?? '');
  if (!durationSec) return null;

  const thumb =
    item.snippet?.thumbnails?.medium?.url
    ?? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

  return {
    url: `https://www.youtube.com/watch?v=${videoId}`,
    videoId,
    title: item.snippet?.title?.trim() || videoId,
    channelTitle: item.snippet?.channelTitle?.trim() || undefined,
    thumbnail: thumb,
    durationSec,
  };
}

function rejectReasonFromApiItem(item: YoutubeVideoApiItem): StreamParseRejectReason {
  const status = item.status;
  if (status?.contentRating?.ytRating === 'ytAgeRestricted') return 'age_restricted';
  if (!isYoutubeVideoEmbeddable(status)) return 'not_embeddable';
  if (item.contentDetails?.regionRestriction?.blocked?.length) return 'region_locked';
  return 'no_duration';
}

async function fetchVideoApiItems(
  videoIds: string[],
  apiKey: string,
): Promise<Map<string, YoutubeVideoApiItem>> {
  const out = new Map<string, YoutubeVideoApiItem>();
  for (let i = 0; i < videoIds.length; i += 50) {
    const batch = videoIds.slice(i, i + 50);
    const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
    detailsUrl.searchParams.set('part', 'contentDetails,snippet,status');
    detailsUrl.searchParams.set('id', batch.join(','));
    detailsUrl.searchParams.set('key', apiKey);

    const res = await fetch(detailsUrl);
    if (!res.ok) continue;

    const data = await res.json() as { items?: YoutubeVideoApiItem[] };
    for (const item of data.items ?? []) {
      if (item.id) out.set(item.id, item);
    }
  }
  return out;
}

async function resolveVideoIdsToStageStreams(
  videoIds: string[],
  apiKey: string,
  maxToAdd: number,
  existingVideoIds: Set<string>,
): Promise<{ streams: ParsedStageStream[]; skipped: number }> {
  const uniqueIds = [...new Set(videoIds)];
  const fetchCount = Math.min(uniqueIds.length, Math.max(maxToAdd * 3, maxToAdd));
  const byId = await fetchVideoApiItems(uniqueIds.slice(0, fetchCount), apiKey);

  const streams: ParsedStageStream[] = [];
  let skipped = 0;

  for (const videoId of uniqueIds) {
    if (streams.length >= maxToAdd) break;
    if (existingVideoIds.has(videoId)) {
      skipped += 1;
      continue;
    }
    const item = byId.get(videoId);
    if (!item) {
      skipped += 1;
      continue;
    }
    const stream = stageStreamFromApiItem(item);
    if (!stream) {
      skipped += 1;
      continue;
    }
    streams.push(stream);
    existingVideoIds.add(videoId);
  }

  return { streams, skipped };
}

/** Parse and validate a YouTube URL at paste time — never defer to runtime. */
export async function parseStageStreamUrl(
  input: string,
  apiKey?: string,
): Promise<StreamParseResult> {
  const videoId = parseYoutubeVideoId(input);
  if (!videoId) {
    return reject('invalid_url', 'Paste a valid YouTube link.');
  }

  if (apiKey) {
    try {
      const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      detailsUrl.searchParams.set('part', 'contentDetails,snippet,status');
      detailsUrl.searchParams.set('id', videoId);
      detailsUrl.searchParams.set('key', apiKey);

      const res = await fetch(detailsUrl);
      if (res.ok) {
        const data = await res.json() as { items?: YoutubeVideoApiItem[] };

        const item = data.items?.[0];
        if (!item) return reject('not_found', 'Video not found or unavailable.');

        const stream = stageStreamFromApiItem(item);
        if (!stream) {
          const reason = rejectReasonFromApiItem(item);
          if (reason === 'age_restricted') {
            return reject('age_restricted', 'Age-restricted videos cannot be used.');
          }
          if (reason === 'not_embeddable') {
            return reject('not_embeddable', 'This video cannot be embedded.');
          }
          if (reason === 'region_locked') {
            return reject('region_locked', 'Region-restricted videos cannot be used.');
          }
          return reject('no_duration', 'Live streams and videos without a fixed length are not supported.');
        }

        return { ok: true, stream };
      }
    } catch {
      /* fall through to oEmbed */
    }
  }

  try {
    const oembed = await fetchYoutubeOembed(videoId);
    if (!oembed.embeddable) {
      return reject('not_embeddable', 'This video cannot be embedded.');
    }
    return reject(
      'no_duration',
      'Could not verify video length. Try again — a YouTube API key may be required for this clip.',
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Video not found or unavailable.';
    if (msg.toLowerCase().includes('401') || msg.toLowerCase().includes('403')) {
      return reject('age_restricted', 'Video unavailable — it may be age-restricted or private.');
    }
    return reject('not_found', 'Video not found or unavailable.');
  }
}

/** Parse a video, playlist, or channel URL into stage streams. */
export async function parseStageStreamSource(
  input: string,
  mode: StageStreamPasteMode,
  opts: {
    apiKey?: string;
    maxToAdd: number;
    existingVideoIds?: string[];
  },
): Promise<StreamParseResult | StreamBulkParseResult> {
  const trimmed = input.trim();
  if (!trimmed) {
    return rejectBulk('empty', 'Paste a YouTube link.');
  }

  if (mode === 'video') {
    return parseStageStreamUrl(trimmed, opts.apiKey);
  }

  if (!opts.apiKey) {
    return rejectBulk(
      'invalid_url',
      'Playlist and channel import require a YouTube API key on the server.',
    );
  }

  const existing = new Set(opts.existingVideoIds ?? []);
  const maxToAdd = Math.max(0, opts.maxToAdd);
  if (maxToAdd === 0) {
    return rejectBulk('invalid_url', 'Your lineup is full.');
  }

  try {
    let videoIds: string[] = [];

    if (mode === 'playlist') {
      const playlistId = parseYoutubePlaylistId(trimmed);
      if (!playlistId) {
        return rejectBulk('invalid_url', 'Paste a valid YouTube playlist link.');
      }
      videoIds = await fetchYoutubePlaylistVideoIds(
        playlistId,
        opts.apiKey,
        Math.min(maxToAdd * 3, 50),
      );
    } else {
      const channelRef = parseYoutubeChannelRef(trimmed);
      if (!channelRef) {
        return rejectBulk(
          'invalid_url',
          'Paste a channel link or @handle (e.g. youtube.com/@name).',
        );
      }
      videoIds = await fetchYoutubeChannelVideoIds(
        channelRef,
        opts.apiKey,
        Math.min(maxToAdd * 3, 50),
      );
    }

    if (!videoIds.length) {
      return rejectBulk('not_found', 'No videos found.');
    }

    const { streams, skipped } = await resolveVideoIdsToStageStreams(
      videoIds,
      opts.apiKey,
      maxToAdd,
      existing,
    );

    if (!streams.length) {
      return rejectBulk(
        'not_embeddable',
        skipped > 0
          ? 'No embeddable videos could be added from that source.'
          : 'No valid videos found.',
      );
    }

    return {
      ok: true,
      streams,
      skipped,
      totalFound: videoIds.length,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not load videos.';
    return rejectBulk('not_found', msg);
  }
}

export function parseStreamsJson(raw: unknown): StageStream[] {
  if (!Array.isArray(raw)) return [];
  const out: StageStream[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const videoId = typeof o.videoId === 'string' ? o.videoId : '';
    const url = typeof o.url === 'string' ? o.url : '';
    const title = typeof o.title === 'string' ? o.title : '';
    const channelTitle = typeof o.channelTitle === 'string' ? o.channelTitle.trim() : '';
    const thumbnail = typeof o.thumbnail === 'string' ? o.thumbnail : '';
    const durationSec = o.durationSec != null ? Number(o.durationSec) : null;
    if (!videoId || !/^[\w-]{11}$/.test(videoId)) continue;
    if (!title.trim()) continue;
    out.push({
      url: url || `https://www.youtube.com/watch?v=${videoId}`,
      videoId,
      title: title.trim(),
      ...(channelTitle ? { channelTitle } : {}),
      thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      durationSec: Number.isFinite(durationSec) && durationSec! > 0 ? durationSec : null,
    });
  }
  return out;
}

/** Fill missing channelTitle from YouTube (API batch, then oEmbed per video). */
export async function enrichStreamsChannelTitles(streams: StageStream[]): Promise<StageStream[]> {
  const missing = streams.filter(s => !s.channelTitle?.trim());
  if (!missing.length) return streams;

  const apiKey = process.env.YOUTUBE_API_KEY;
  const channelByVideoId = new Map<string, string>();

  if (apiKey) {
    const byId = await fetchVideoApiItems(missing.map(s => s.videoId), apiKey);
    for (const [id, item] of byId) {
      const channel = item.snippet?.channelTitle?.trim();
      if (channel) channelByVideoId.set(id, channel);
    }
  }

  const stillMissing = missing.filter(s => !channelByVideoId.has(s.videoId));
  if (stillMissing.length) {
    await Promise.all(stillMissing.map(async s => {
      try {
        const oembed = await fetchYoutubeOembed(s.videoId);
        const channel = oembed.channelTitle?.trim();
        if (channel) channelByVideoId.set(s.videoId, channel);
      } catch {
        /* skip */
      }
    }));
  }

  if (!channelByVideoId.size) return streams;

  return streams.map(s => {
    const channel = channelByVideoId.get(s.videoId);
    return channel ? { ...s, channelTitle: channel } : s;
  });
}
