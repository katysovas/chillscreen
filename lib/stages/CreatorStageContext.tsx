'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from 'react';
import type { UserStagePublic } from '@/lib/stages/types';
import { touchStagePresence, updateUserStage } from '@/lib/stages/client';
import {
  mergeCreatorStageSync,
  stageSyncFingerprint,
  toCreatorStageSyncPayload,
  type CreatorStageSyncPayload,
} from '@/lib/stages/stageSync';

type SetStageOptions = { broadcast?: boolean };

type CreatorStageContextValue = {
  stage: UserStagePublic;
  isOwner: boolean;
  setStage: (stage: UserStagePublic, opts?: SetStageOptions) => void;
  applyRemoteStage: (patch: CreatorStageSyncPayload) => void;
  registerStageBroadcast: (fn: ((payload: CreatorStageSyncPayload) => void) | null) => void;
  swapNowPlaying: (index: number) => Promise<void>;
};

const CreatorStageContext = createContext<CreatorStageContextValue | null>(null);

type ProviderProps = {
  initialStage: UserStagePublic;
  /** Stage row owner — compared to the signed-in viewer. */
  ownerUserId?: string | null;
  currentUserId?: string | null;
  /** Viewer is signed in (festie session). */
  authenticated?: boolean;
  /** Player session finished hydrating from /api/player. */
  sessionReady?: boolean;
  children: ReactNode;
};

function viewerIsStageOwner(
  ownerUserId: string | null | undefined,
  currentUserId: string | null | undefined,
  authenticated: boolean,
  sessionReady: boolean,
): boolean {
  if (!sessionReady || !authenticated) return false;
  if (!ownerUserId || !currentUserId) return false;
  return ownerUserId === currentUserId;
}

export function CreatorStageProvider({
  initialStage,
  ownerUserId,
  currentUserId,
  authenticated = false,
  sessionReady = false,
  children,
}: ProviderProps) {
  const [stage, setStageState] = useState(initialStage);
  const isOwner = viewerIsStageOwner(ownerUserId, currentUserId, authenticated, sessionReady);
  const broadcastRef = useRef<((payload: CreatorStageSyncPayload) => void) | null>(null);

  const registerStageBroadcast = useCallback(
    (fn: ((payload: CreatorStageSyncPayload) => void) | null) => {
      broadcastRef.current = fn;
    },
    [],
  );

  const setStage = useCallback((next: UserStagePublic, opts?: SetStageOptions) => {
    setStageState(prev => {
      if (stageSyncFingerprint(next) === stageSyncFingerprint(prev)) return prev;
      return next;
    });
    if (opts?.broadcast) {
      broadcastRef.current?.(toCreatorStageSyncPayload(next));
    }
  }, []);

  const applyRemoteStage = useCallback((patch: CreatorStageSyncPayload) => {
    setStageState(prev => {
      const merged = mergeCreatorStageSync(prev, patch);
      if (stageSyncFingerprint(merged) === stageSyncFingerprint(prev)) return prev;
      return merged;
    });
  }, []);

  const swapNowPlaying = useCallback(async (index: number) => {
    if (!isOwner) return;
    const updated = await updateUserStage(stage.slug, { nowPlayingIndex: index });
    setStage(updated, { broadcast: true });
  }, [isOwner, stage.slug, setStage]);

  const value = useMemo(
    () => ({ stage, isOwner, setStage, applyRemoteStage, registerStageBroadcast, swapNowPlaying }),
    [stage, isOwner, setStage, applyRemoteStage, registerStageBroadcast, swapNowPlaying],
  );

  return (
    <CreatorStageContext.Provider value={value}>
      {children}
    </CreatorStageContext.Provider>
  );
}

export function useOptionalCreatorStage(): UserStagePublic | null {
  return useContext(CreatorStageContext)?.stage ?? null;
}

export function useCreatorStageControls(): CreatorStageContextValue | null {
  return useContext(CreatorStageContext);
}

/** True only for the signed-in stage owner on /watch/{slug}. */
export function useIsCreatorStageOwner(): boolean {
  return useContext(CreatorStageContext)?.isOwner ?? false;
}

/** Bump last_active_at on mount and periodically (server skips if recently touched). */
export function useCreatorStagePresence(slug: string | null): void {
  useEffect(() => {
    if (!slug) return;
    void touchStagePresence(slug);
    const id = window.setInterval(() => { void touchStagePresence(slug); }, 5 * 60_000);
    return () => window.clearInterval(id);
  }, [slug]);
}
