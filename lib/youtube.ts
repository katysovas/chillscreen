export type YouTubeVideo = { id: string; title: string };

/** @deprecated Use YouTubeVideo */
export type CinemaVideo = YouTubeVideo;

const CACHE_TTL_MS = 60 * 60 * 1000;
const caches = new Map<string, { videos: YouTubeVideo[]; fetchedAt: number }>();

type YouTubeSearchItem = {
  id?: { videoId?: string };
  snippet?: { title?: string };
};

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[];
};

type YouTubeVideosItem = {
  id?: string;
  player?: { embedHtml?: string };
};

type YouTubeVideosResponse = {
  items?: YouTubeVideosItem[];
};

/**
 * Returns the subset of `ids` whose videos are landscape (width > height).
 * YouTube's `videos.list` `player.embedHtml` carries width/height attributes
 * that reflect the source aspect ratio, so portrait clips / Shorts get dropped.
 */
async function filterLandscapeIds(ids: string[], key: string): Promise<Set<string>> {
  const landscape = new Set<string>();

  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    const params = new URLSearchParams({
      part: 'player',
      id: batch.join(','),
      maxHeight: '720',
      key,
    });

    const res = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${params}`,
      { next: { revalidate: 3600 } },
    );
    if (!res.ok) continue;

    const data = (await res.json()) as YouTubeVideosResponse;
    for (const item of data.items ?? []) {
      const html = item.player?.embedHtml;
      if (!item.id || !html) continue;
      const w = Number(/width="(\d+)"/.exec(html)?.[1]);
      const h = Number(/height="(\d+)"/.exec(html)?.[1]);
      if (w && h && w > h) landscape.add(item.id);
    }
  }

  return landscape;
}

async function searchYouTube(query: string): Promise<YouTubeVideo[]> {
  const cached = caches.get(query);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.videos;
  }

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error('YOUTUBE_API_KEY is not configured');
  }

  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    videoEmbeddable: 'true',
    safeSearch: 'strict',
    maxResults: '50',
    key,
  });

  const res = await fetch(
    `https://www.googleapis.com/youtube/v3/search?${params}`,
    { next: { revalidate: 3600 } },
  );

  if (!res.ok) {
    throw new Error(`YouTube API responded with ${res.status}`);
  }

  const data = (await res.json()) as YouTubeSearchResponse;
  const found: YouTubeVideo[] = (data.items ?? [])
    .filter(item => item.id?.videoId && item.snippet?.title)
    .map(item => ({
      id: item.id!.videoId!,
      title: item.snippet!.title!,
    }));

  if (found.length === 0) {
    throw new Error(`No embeddable videos found for "${query}"`);
  }

  // Keep landscape only — drops portrait clips and Shorts. If the dimension
  // lookup fails entirely, fall back to the unfiltered list so the stage still
  // has something to play.
  const landscapeIds = await filterLandscapeIds(found.map(v => v.id), key);
  const videos = landscapeIds.size > 0
    ? found.filter(v => landscapeIds.has(v.id))
    : found;

  caches.set(query, { videos, fetchedAt: Date.now() });
  return videos;
}

export function searchCinemaVideos() {
  return searchYouTube('cute animals');
}

export function searchConcertVideos() {
  return searchYouTube('live concert');
}

export function searchBumbershootVideos() {
  return searchYouTube('Bumbershoot live');
}

export function searchOutsideLandsVideos() {
  return searchYouTube('outside lands live');
}

export function searchCoachellaVideos() {
  return searchYouTube('coachella live');
}
