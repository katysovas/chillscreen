/**
 * Cinema embed URL builder. Playlists come from the synchronized schedule.
 * Only called client-side (after mount) — safe to include `origin`.
 */
export { stageEmbedSrc as cinemaEmbedSrc } from '@/lib/youtubePlayer';
