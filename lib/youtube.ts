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
  const videos: YouTubeVideo[] = (data.items ?? [])
    .filter(item => item.id?.videoId && item.snippet?.title)
    .map(item => ({
      id: item.id!.videoId!,
      title: item.snippet!.title!,
    }));

  if (videos.length === 0) {
    throw new Error(`No embeddable videos found for "${query}"`);
  }

  caches.set(query, { videos, fetchedAt: Date.now() });
  return videos;
}

export function searchCinemaVideos() {
  return searchYouTube('cute animals');
}

export function searchConcertVideos() {
  return searchYouTube('live concert');
}

export function searchCoachellaVideos() {
  return searchYouTube('coachella live');
}
