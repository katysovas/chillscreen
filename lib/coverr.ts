import { CoverrVideo, CoverrAudio, HydratedCategory } from './types';

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

interface CuratedResponse {
  videos: CoverrVideo[];
  audio: CoverrAudio[];
  categories: HydratedCategory[];
}

export async function fetchCurated(): Promise<CuratedResponse> {
  const res = await fetch('/api/coverr/curated', { cache: 'no-store' });
  if (!res.ok) return { videos: [], audio: [], categories: [] };
  return res.json();
}

export async function fetchRandomVideo(): Promise<CoverrVideo> {
  const curated = await fetchCurated().catch(() => ({ videos: [], audio: [], categories: [] }));
  if (curated.videos.length) return rand(curated.videos);
  const res = await fetch('/api/coverr/videos?query=calm+nature&sort=popular&page_size=20&urls=true');
  const data = await res.json();
  return rand(data.hits);
}

export async function fetchVideos(query: string, page = 0): Promise<CoverrVideo[]> {
  const res = await fetch(
    `/api/coverr/videos?query=${encodeURIComponent(query)}&sort=popular&page=${page}&page_size=20&urls=true`
  );
  return (await res.json()).hits ?? [];
}

export async function fetchRandomAudio(): Promise<CoverrAudio | null> {
  const curated = await fetchCurated().catch(() => ({ videos: [], audio: [], categories: [] }));
  const curatedFree = curated.audio.filter(a => !a.isPremium);
  if (curatedFree.length) return rand(curatedFree);
  const res = await fetch('/api/coverr/audios?query=ambient&sort=popular&page_size=20');
  const data = await res.json();
  const free = (data.hits ?? []).filter((a: CoverrAudio) => !a.isPremium);
  if (!free.length) return null;
  return rand(free);
}

export async function pingDownload(videoId: string) {
  await fetch(`/api/coverr/videos/${videoId}/ping`, { method: 'PATCH' });
}
