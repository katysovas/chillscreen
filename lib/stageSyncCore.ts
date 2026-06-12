/**
 * Synchronized-playback types + schedule math — no bundled JSON (client-safe).
 */

export type StageVideo = {
  id: string;
  title: string;
  durationSec?: number;
};

export type StageChannel =
  | 'cinema'
  | 'deep-space'
  | 'bumbershoot'
  | 'outside-lands'
  | 'coachella'
  | 'edc'
  | 'which-stage'
  | 'forest'
  | 'silent-disco';

export const STAGE_CHANNELS: StageChannel[] = [
  'cinema',
  'deep-space',
  'bumbershoot',
  'outside-lands',
  'coachella',
  'edc',
  'which-stage',
  'forest',
  'silent-disco',
];

export const DEFAULT_DURATION_MS = 60 * 60 * 1000;
export const STAGE_EPOCH = Date.UTC(2025, 0, 1);

export type StageSync = {
  epoch: number;
  defaultDurationMs: number;
  playlists: Partial<Record<StageChannel, StageVideo[]>>;
};

export const EMPTY_STAGE_SYNC: StageSync = {
  epoch: STAGE_EPOCH,
  defaultDurationMs: DEFAULT_DURATION_MS,
  playlists: {},
};

export type ScheduledVideo = {
  video: StageVideo;
  index: number;
  offsetSec: number;
  msUntilNext: number;
};

/** Prefer the richer playlist when merging two partial sync payloads. */
export function mergePartialPlaylists(
  existing: Partial<Record<StageChannel, StageVideo[]>> | undefined,
  incoming: Partial<Record<StageChannel, StageVideo[]>> | undefined,
): Partial<Record<StageChannel, StageVideo[]>> {
  const out: Partial<Record<StageChannel, StageVideo[]>> = { ...existing };
  for (const channel of STAGE_CHANNELS) {
    const next = incoming?.[channel];
    if (!next?.length) continue;
    const prev = out[channel];
    out[channel] = !prev?.length || next.length >= prev.length ? next : prev;
  }
  return out;
}

export function scheduleFor(
  channel: StageChannel,
  now: number,
  sync: StageSync = EMPTY_STAGE_SYNC,
): ScheduledVideo | null {
  const list = sync.playlists[channel] ?? [];
  if (!list.length) return null;

  const durationsMs = list.map(v =>
    v.durationSec ? v.durationSec * 1000 : sync.defaultDurationMs,
  );
  const cycleMs = durationsMs.reduce((a, b) => a + b, 0);
  const elapsed = Math.max(0, now - sync.epoch);
  const posInCycle = elapsed % cycleMs;

  let acc = 0;
  for (let i = 0; i < list.length; i++) {
    const slotMs = durationsMs[i];
    if (posInCycle < acc + slotMs) {
      const slotOffsetMs = posInCycle - acc;
      return {
        video: list[i]!,
        index: i,
        offsetSec: slotOffsetMs / 1000,
        msUntilNext: slotMs - slotOffsetMs,
      };
    }
    acc += slotMs;
  }

  return { video: list[0]!, index: 0, offsetSec: 0, msUntilNext: durationsMs[0]! };
}
