'use client';

import { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_STAGE_SYNC,
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
 * built-in default sync, so videos still rotate on a shared deterministic
 * schedule even if the room is unreachable.
 */

let clockOffsetMs = 0;
let serverSync: StageSync | null = null;
const listeners = new Set<() => void>();

/** Apply the server handshake: align our clock + adopt the pinned playlists. */
export function applyServerStageSync(serverNow: number, sync: StageSync) {
  clockOffsetMs = serverNow - Date.now();
  serverSync = sync;
  for (const notify of listeners) notify();
}

export function getStageSync(): StageSync {
  return serverSync ?? DEFAULT_STAGE_SYNC;
}

/** Wall-clock time aligned to the server (falls back to local time pre-sync). */
export function syncedNow(): number {
  return Date.now() + clockOffsetMs;
}

/** Current scheduled video + seek offset for a channel, right now. */
export function currentSchedule(channel: StageChannel): ScheduledVideo | null {
  return scheduleFor(channel, syncedNow(), getStageSync());
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

export type StageChannelState = {
  /** The video that should be playing now (undefined while not live). */
  video: StageVideo | undefined;
  index: number;
  /** Bumps on every rotation so the caller can remount its <iframe>. */
  vidKey: number;
};

/**
 * Subscribes a component to the synchronized schedule for one channel. Returns
 * the current video + a `vidKey` that changes whenever the schedule rotates,
 * and arms a single timer aligned to the next rotation boundary (no polling).
 */
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
        if (lastIndexRef.current !== null && lastIndexRef.current !== next.index) {
          setVidKey(k => k + 1);
        }
        lastIndexRef.current = next.index;
      }
      setSchedule(next);

      if (next) {
        // Re-evaluate just after the next rotation boundary.
        timer = setTimeout(tick, Math.max(250, next.msUntilNext) + 50);
      }
    };

    tick();
    // Re-run immediately when the server handshake arrives / clock realigns.
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
