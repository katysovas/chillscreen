import type { StageStream } from '@/lib/stages/types';

/** Move a stream within the lineup and keep now-playing pinned to the same video. */
export function reorderStageStreams(
  streams: StageStream[],
  fromIndex: number,
  toIndex: number,
  nowPlayingIndex: number,
): { streams: StageStream[]; nowPlayingIndex: number } {
  if (
    fromIndex === toIndex
    || fromIndex < 0
    || toIndex < 0
    || fromIndex >= streams.length
    || toIndex >= streams.length
  ) {
    return { streams, nowPlayingIndex };
  }

  const playingId = streams[nowPlayingIndex]?.videoId ?? null;
  const next = [...streams];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);

  let nextIndex = nowPlayingIndex;
  if (playingId) {
    const found = next.findIndex(s => s.videoId === playingId);
    nextIndex = found >= 0 ? found : Math.min(nowPlayingIndex, next.length - 1);
  }

  return {
    streams: next,
    nowPlayingIndex: Math.max(0, Math.min(nextIndex, next.length - 1)),
  };
}
