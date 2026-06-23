'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_STAGE_SYNC,
  mergeStageSyncPlaylists,
  scheduleFor,
  type ScheduledVideo,
  type StageChannel,
  type StageSync,
  type StageVideo,
} from './stageVideos';

/**
 * Shared synchronized-playback clock.
 *
 * The PartyKit server is the single source of truth for the timeline: on join
 * it hands every client its current wall-clock (`serverNow`) plus the pinned
 * playlists + epoch. We store the clock skew so `syncedNow()` matches the
 * server (and therefore every other client), then derive the current video +
 * seek position deterministically. No per-tick network traffic is needed.
 *
 * Works single-player too: until the handshake arrives we fall back to the
 * bundled channel JSON, so videos still rotate on a shared deterministic
 * schedule even if the room is unreachable.
 */

type SyncSource = 'partykit' | 'api' | 'local';

let clockOffsetMs = 0;
let serverSync: StageSync | null = null;
let syncSource: SyncSource | null = null;
let bootstrapStarted = false;
let bootstrapChannel: StageChannel | null = null;
let apiFetchAbort: AbortController | null = null;
const listeners = new Set<() => void>();

/** Apply the server handshake: align our clock + adopt the pinned playlists. */
export function applyServerStageSync(
  serverNow: number,
  sync: Pick<StageSync, 'epoch' | 'defaultDurationMs'> & {
    playlists: Partial<Record<StageChannel, StageVideo[]>>;
    matchup?: Partial<StageSync['matchup']>;
  },
  source?: SyncSource,
) {
  const playlists = serverSync
    ? mergeStageSyncPlaylists(serverSync.playlists, sync.playlists)
    : mergeStageSyncPlaylists(undefined, sync.playlists);
  const matchup = { ...serverSync?.matchup, ...sync.matchup };

  // PartyKit owns the clock once connected; API can still upgrade fallback playlists.
  if (source === 'api' && syncSource === 'partykit' && serverSync) {
    serverSync = { ...serverSync, playlists, matchup };
    for (const notify of listeners) notify();
    return;
  }

  clockOffsetMs = serverNow - Date.now();
  serverSync = { ...sync, playlists, matchup };
  if (source) syncSource = source;

  for (const notify of listeners) notify();
}

/** Seed one channel's fallback playlist before the API/PartyKit handshake. */
export function applyLocalChannelPlaylist(channel: StageChannel, videos: StageVideo[]) {
  if (!videos.length) return;
  const playlists = mergeStageSyncPlaylists(serverSync?.playlists, { [channel]: videos });
  if (serverSync) {
    serverSync = { ...serverSync, playlists };
    if (!syncSource) syncSource = 'local';
  } else {
    serverSync = {
      epoch: DEFAULT_STAGE_SYNC.epoch,
      defaultDurationMs: DEFAULT_STAGE_SYNC.defaultDurationMs,
      playlists,
    };
    syncSource = 'local';
  }
  for (const notify of listeners) notify();
}

/**
 * Fetch resolved playlist for one stage channel from the Next.js API.
 * Runs in parallel with PartyKit; when both complete, API-resolved youtube-api
 * playlists replace PartyKit fallbacks (e.g. missing YOUTUBE_API_KEY on PartyKit).
 */
export function bootstrapStageSyncFromApi(channel: StageChannel) {
  if (typeof window === 'undefined') return;
  if (bootstrapStarted && bootstrapChannel === channel) return;

  apiFetchAbort?.abort();
  bootstrapStarted = true;
  if (bootstrapChannel !== channel) {
    // Venue changed — drop stale partial sync so curated channels re-pin from bundled JSON.
    serverSync = null;
    syncSource = null;
  }
  bootstrapChannel = channel;

  const controller = new AbortController();
  apiFetchAbort = controller;

  fetch(`/api/stage/sync?channel=${encodeURIComponent(channel)}`, { signal: controller.signal })
    .then(res => {
      if (!res.ok) return Promise.reject(new Error(String(res.status)));
      const ageSec = parseInt(res.headers.get('Age') ?? '0', 10);
      return res.json().then((body: { serverNow: number; stage: StageSync }) => ({
        serverNow: body.serverNow + ageSec * 1000,
        stage: body.stage,
      }));
    })
    .then(({ serverNow, stage }) => {
      apiFetchAbort = null;
      applyServerStageSync(serverNow, stage, 'api');
    })
    .catch(() => {
      apiFetchAbort = null;
      if (controller.signal.aborted) return;
    });
}

export function getStageSync(): StageSync {
  return serverSync ?? DEFAULT_STAGE_SYNC;
}

export function syncedNow(): number {
  return Date.now() + clockOffsetMs;
}

export function currentSchedule(channel: StageChannel): ScheduledVideo | null {
  return scheduleFor(channel, syncedNow(), getStageSync());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export function subscribeStageSync(cb: () => void): () => void {
  return subscribe(cb);
}

export type StageChannelState = {
  video: StageVideo | undefined;
  index: number;
  vidKey: number;
};

export function useStageChannel(channel: StageChannel, live: boolean): StageChannelState {
  const [schedule, setSchedule] = useState<ScheduledVideo | null>(() =>
    currentSchedule(channel),
  );
  const [vidKey, setVidKey] = useState(0);
  const lastIndexRef = useRef<number | null>(null);

  useEffect(() => {
    if (!live) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const tick = () => {
      if (cancelled) return;
      const next = currentSchedule(channel);

      if (next) {
        const prevIndex = lastIndexRef.current;
        if (prevIndex === null || prevIndex !== next.index) {
          console.log(`[${channel}] scheduled`, next.video.id, next.video.title);
        }
        if (prevIndex !== null && prevIndex !== next.index) {
          setVidKey(k => k + 1);
        }
        lastIndexRef.current = next.index;
      }
      setSchedule(next);

      if (next) {
        timer = setTimeout(tick, Math.max(250, next.msUntilNext) + 50);
      } else {
        timer = setTimeout(tick, 500);
      }
    };

    tick();
    const unsubscribe = subscribe(tick);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      unsubscribe();
    };
  }, [channel, live]);

  return {
    video: live ? schedule?.video : undefined,
    index: schedule?.index ?? 0,
    vidKey,
  };
}
