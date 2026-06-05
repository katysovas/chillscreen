import type { YouTubeVideo } from './youtube';

/** Known-good embeddable streams when the YouTube API is unavailable. */
export const CINEMA_FALLBACK: YouTubeVideo[] = [
  { id: 'RhOwyHWGqWg', title: 'Cute Baby Animals 4K' },
  { id: 'jfKfPfyJRdk', title: 'Lo-Fi Girl Radio' },
  { id: '5qap5aO4i9A', title: 'Lo-Fi Beats 24/7' },
  { id: 'lTRiuFIWV54', title: 'Ocean Waves' },
  { id: 'DWcJFNfaw9c', title: 'Rain & Chill' },
];

let pool: YouTubeVideo[] | null = null;
let loadPromise: Promise<YouTubeVideo[]> | null = null;

/** Load cinema videos once per session; falls back to CINEMA_FALLBACK on error. */
export function loadCinemaVideos(): Promise<YouTubeVideo[]> {
  if (pool) return Promise.resolve(pool);
  if (loadPromise) return loadPromise;

  loadPromise = fetch('/api/cinema/videos')
    .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
    .then((data: { videos?: YouTubeVideo[] }) => {
      pool = data.videos?.length ? data.videos : CINEMA_FALLBACK;
      return pool;
    })
    .catch(() => {
      pool = CINEMA_FALLBACK;
      return pool;
    })
    .finally(() => {
      loadPromise = null;
    });

  return loadPromise;
}

export function cinemaEmbedSrc(id: string) {
  const params = new URLSearchParams({
    autoplay: '1',
    mute: '1',
    rel: '0',
    modestbranding: '1',
    controls: '0',
    iv_load_policy: '3',
    loop: '1',
    playlist: id,
    playsinline: '1',
  });
  if (typeof window !== 'undefined') {
    params.set('origin', window.location.origin);
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}
