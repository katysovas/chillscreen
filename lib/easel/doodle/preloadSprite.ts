const preloaded = new Set<string>();
const inflight = new Map<string, Promise<void>>();

/** Warm the browser cache for an easel sprite path. */
export function preloadDoodleSprite(spritePath: string): Promise<void> {
  if (!spritePath || typeof window === 'undefined') return Promise.resolve();
  if (preloaded.has(spritePath)) return Promise.resolve();

  const pending = inflight.get(spritePath);
  if (pending) return pending;

  const promise = new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      preloaded.add(spritePath);
      inflight.delete(spritePath);
      resolve();
    };
    img.onerror = () => {
      inflight.delete(spritePath);
      reject(new Error(`sprite preload failed: ${spritePath}`));
    };
    img.src = spritePath;
  });

  inflight.set(spritePath, promise);
  return promise.catch(() => {});
}
