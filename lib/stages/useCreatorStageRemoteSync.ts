'use client';

import { useEffect } from 'react';
import { fetchUserStage } from '@/lib/stages/client';
import { useCreatorStageControls } from '@/lib/stages/CreatorStageContext';
import type { CreatorStageSyncPayload } from '@/lib/stages/stageSync';

const OWNER_POLL_MS = 30_000;
const VIEWER_POLL_MS = 60_000;

type MultiplayerStageSync = {
  connected: boolean;
  sendCreatorStageSync: (payload: CreatorStageSyncPayload) => void;
  registerCreatorStageSyncHandler: (
    handler: ((payload: CreatorStageSyncPayload) => void) | null,
  ) => void;
};
/** Poll + PartyKit push/pull for creator stage lineup — keeps viewers in sync without 15s hammering. */
export function useCreatorStageRemoteSync(
  slug: string | null | undefined,
  isOwner: boolean,
  mp: MultiplayerStageSync,
): void {
  const ctx = useCreatorStageControls();

  useEffect(() => {
    if (!ctx) return;

    mp.registerCreatorStageSyncHandler(patch => {
      ctx.applyRemoteStage(patch);
    });
    ctx.registerStageBroadcast(payload => {
      if (mp.connected) mp.sendCreatorStageSync(payload);
    });

    return () => {
      mp.registerCreatorStageSyncHandler(null);
      ctx.registerStageBroadcast(null);
    };
  }, [ctx, mp, mp.connected, mp.registerCreatorStageSyncHandler, mp.sendCreatorStageSync]);

  useEffect(() => {
    if (!slug || !ctx) return;

    let cancelled = false;
    const intervalMs = isOwner ? OWNER_POLL_MS : VIEWER_POLL_MS;

    const poll = async () => {
      if (document.hidden) return;
      try {
        const fresh = await fetchUserStage(slug);
        if (!fresh || cancelled) return;
        ctx.setStage(fresh);
      } catch {
        /* ignore transient poll errors */
      }
    };

    void poll();
    const id = window.setInterval(() => { void poll(); }, intervalMs);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [slug, isOwner, ctx]);
}
