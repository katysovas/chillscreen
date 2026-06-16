import {
  fetchYoutubeOembed,
  isYoutubeVideoEmbeddable,
  parseYoutubeDuration,
  parseYoutubeVideoId,
} from '@/lib/youtubeApi';
import type { StageStream } from '@/lib/stages/types';

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

function reject(reason: StreamParseRejectReason, message: string): StreamParseResult {
  return { ok: false, reason, message };
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

  const url = `https://www.youtube.com/watch?v=${videoId}`;

  if (apiKey) {
    try {
      const detailsUrl = new URL('https://www.googleapis.com/youtube/v3/videos');
      detailsUrl.searchParams.set('part', 'contentDetails,snippet,status');
      detailsUrl.searchParams.set('id', videoId);
      detailsUrl.searchParams.set('key', apiKey);

      const res = await fetch(detailsUrl);
      if (res.ok) {
        const data = await res.json() as {
          items?: {
            id: string;
            snippet?: { title?: string; thumbnails?: { medium?: { url?: string } } };
            contentDetails?: { duration?: string; regionRestriction?: { blocked?: string[] } };
            status?: {
              embeddable?: boolean;
              privacyStatus?: string;
              uploadStatus?: string;
              contentRating?: { ytRating?: string };
            };
          }[];
        };

        const item = data.items?.[0];
        if (!item) return reject('not_found', 'Video not found or unavailable.');

        const status = item.status;
        if (status?.contentRating?.ytRating === 'ytAgeRestricted') {
          return reject('age_restricted', 'Age-restricted videos cannot be used.');
        }
        if (!isYoutubeVideoEmbeddable(status)) {
          return reject('not_embeddable', 'This video cannot be embedded.');
        }
        if (item.contentDetails?.regionRestriction?.blocked?.length) {
          return reject('region_locked', 'Region-restricted videos cannot be used.');
        }

        const durationSec = parseYoutubeDuration(item.contentDetails?.duration ?? '');
        if (!durationSec) {
          return reject('no_duration', 'Live streams and videos without a fixed length are not supported.');
        }

        const thumb =
          item.snippet?.thumbnails?.medium?.url
          ?? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`;

        return {
          ok: true,
          stream: {
            url,
            videoId,
            title: item.snippet?.title?.trim() || videoId,
            thumbnail: thumb,
            durationSec,
          },
        };
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

export function parseStreamsJson(raw: unknown): StageStream[] {
  if (!Array.isArray(raw)) return [];
  const out: StageStream[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const videoId = typeof o.videoId === 'string' ? o.videoId : '';
    const url = typeof o.url === 'string' ? o.url : '';
    const title = typeof o.title === 'string' ? o.title : '';
    const thumbnail = typeof o.thumbnail === 'string' ? o.thumbnail : '';
    const durationSec = o.durationSec != null ? Number(o.durationSec) : null;
    if (!videoId || !/^[\w-]{11}$/.test(videoId)) continue;
    if (!title.trim()) continue;
    out.push({
      url: url || `https://www.youtube.com/watch?v=${videoId}`,
      videoId,
      title: title.trim(),
      thumbnail: thumbnail || `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
      durationSec: Number.isFinite(durationSec) && durationSec! > 0 ? durationSec : null,
    });
  }
  return out;
}
