/**
 * Cinema embed URL builder. Playlists now come from the synchronized,
 * server-pinned schedule (`@/lib/stageVideos` + `@/lib/stageClock`), so there
 * is no per-client fetch or randomness here anymore.
 */
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
    // Enables IFrame API postMessage so we can seek to the shared position.
    enablejsapi: '1',
  });
  if (typeof window !== 'undefined') {
    params.set('origin', window.location.origin);
  }
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}
