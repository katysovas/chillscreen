/**
 * Cinema embed URL builder. Playlists now come from the synchronized,
 * server-pinned schedule (`@/lib/stageVideos` + `@/lib/stageClock`), so there
 * is no per-client fetch or randomness here anymore.
 */
/** `startSec` is baked in as `start=N` so the video loads from the synced
 *  position immediately — no postMessage race condition. */
export function cinemaEmbedSrc(id: string, startSec = 0) {
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
    enablejsapi: '1',
  });
  if (startSec > 2) params.set('start', String(Math.floor(startSec)));
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}
