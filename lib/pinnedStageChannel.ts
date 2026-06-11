import type { StageChannel } from '@/lib/stageVideos';

/**
 * Isolated-city mode: the page's own stage channel stays mounted and audible
 * regardless of scroll position — users stay in one city at a time, so there
 * is no reason to mute when they walk away from the stage.
 */
let pinned: StageChannel | null = null;
const listeners = new Set<() => void>();

export function setPinnedStageChannel(channel: StageChannel | null): void {
  if (pinned === channel) return;
  pinned = channel;
  for (const cb of listeners) cb();
}

export function getPinnedStageChannel(): StageChannel | null {
  return pinned;
}

export function subscribePinnedStageChannel(cb: () => void): () => void {
  listeners.add(cb);
  cb();
  return () => { listeners.delete(cb); };
}
