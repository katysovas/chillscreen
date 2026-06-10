import type { StageChannel } from '@/lib/stageVideos';

/**
 * Isolated-city mode: the page's own stage channel stays mounted and audible
 * regardless of scroll position — users stay in one city at a time, so there
 * is no reason to mute when they walk away from the stage.
 */
let pinned: StageChannel | null = null;

export function setPinnedStageChannel(channel: StageChannel | null): void {
  pinned = channel;
}

export function getPinnedStageChannel(): StageChannel | null {
  return pinned;
}
