import type { UserStagePublic } from '@/lib/stages/types';

/** Fields replicated to the room when lineup / scene changes. */
export type CreatorStageSyncPayload = Pick<
  UserStagePublic,
  | 'nowPlayingIndex'
  | 'streams'
  | 'backdropUrl'
  | 'preset'
  | 'sky'
  | 'shuffleOnStart'
  | 'displayName'
>;

export function toCreatorStageSyncPayload(stage: UserStagePublic): CreatorStageSyncPayload {
  return {
    nowPlayingIndex: stage.nowPlayingIndex,
    streams: stage.streams,
    backdropUrl: stage.backdropUrl,
    preset: stage.preset,
    sky: stage.sky,
    shuffleOnStart: stage.shuffleOnStart,
    displayName: stage.displayName,
  };
}

/** Stable fingerprint — skip React updates when nothing material changed. */
export function stageSyncFingerprint(stage: UserStagePublic): string {
  return JSON.stringify(toCreatorStageSyncPayload(stage));
}

export function mergeCreatorStageSync(
  current: UserStagePublic,
  patch: CreatorStageSyncPayload,
): UserStagePublic {
  return {
    ...current,
    ...patch,
    backdropUrl: patch.backdropUrl ?? current.backdropUrl,
    sky: patch.sky ?? current.sky,
  };
}
