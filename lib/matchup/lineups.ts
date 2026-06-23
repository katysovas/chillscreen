import type { StageChannel, StageSync, StageVideo } from '@/lib/stageVideos';
import {
  lineupTracksForStreamer,
  pickRotating,
  previewAtCursor,
} from './playlists';
import type { CreatorLineup, MatchupTrack } from './types';

export { lineupTracksForStreamer, pickRotating, previewAtCursor } from './playlists';

export function lineupOf(
  creatorId: string,
  channel: StageChannel,
  sync: StageSync,
): CreatorLineup {
  return { creatorId, tracks: lineupTracksForStreamer(creatorId, channel, sync) };
}

export function representativeVideoForCreator(
  creatorId: string,
  channel: StageChannel,
  sync: StageSync,
): StageVideo | null {
  const tracks = lineupTracksForStreamer(creatorId, channel, sync);
  const first = tracks[0];
  if (!first?.youtubeId) return null;
  return {
    id: first.youtubeId,
    title: first.title,
    durationSec: first.durationSec,
  };
}

export function trackDurationMs(track: MatchupTrack, defaultDurationMs: number): number {
  const sec = track.durationSec;
  if (sec == null || sec <= 0) return defaultDurationMs;
  return sec * 1000;
}

/** Next-up track in the challenger's rotation (vote strip preview). */
export function pickChallengerPreview(
  state: { stageId: StageChannel; cursors: Record<string, number> },
  challengerId: string,
  sync: StageSync,
): MatchupTrack | null {
  const tracks = lineupTracksForStreamer(challengerId, state.stageId, sync);
  const cursor = state.cursors[challengerId] ?? 0;
  return previewAtCursor(tracks, cursor);
}

export function pickNext(
  state: { stageId: StageChannel; cursors: Record<string, number> },
  creatorId: string,
  sync: StageSync,
): { track: MatchupTrack; cursors: Record<string, number> } {
  const tracks = lineupTracksForStreamer(creatorId, state.stageId, sync);
  const cursor = state.cursors[creatorId] ?? 0;
  const { track, nextCursor } = pickRotating(tracks, cursor, sync.defaultDurationMs / 1000);
  return {
    track,
    cursors: { ...state.cursors, [creatorId]: nextCursor },
  };
}
