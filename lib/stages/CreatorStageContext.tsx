'use client';

import {
  createContext,
  useContext,
  useMemo,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { UserStagePublic } from '@/lib/stages/types';
import { fetchUserStage, touchStagePresence, updateUserStage } from '@/lib/stages/client';

type CreatorStageContextValue = {
  stage: UserStagePublic;
  isOwner: boolean;
  setStage: (stage: UserStagePublic) => void;
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
  const [stage, setStage] = useState(initialStage);
  const isOwner = viewerIsStageOwner(ownerUserId, currentUserId, authenticated, sessionReady);

  const swapNowPlaying = useCallback(async (index: number) => {
    if (!isOwner) return;
    const updated = await updateUserStage(stage.slug, { nowPlayingIndex: index });
    setStage(updated);
  }, [isOwner, stage.slug]);

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const fresh = await fetchUserStage(stage.slug);
        if (!cancelled && fresh) setStage(fresh);
      } catch {
        /* ignore transient poll errors */
      }
    };
    const id = window.setInterval(() => { void poll(); }, 15_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [stage.slug]);

  const value = useMemo(
    () => ({ stage, isOwner, setStage, swapNowPlaying }),
    [stage, isOwner, swapNowPlaying],
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

/** Touch presence on mount and periodically while on a creator stage. */
export function useCreatorStagePresence(slug: string | null): void {
  useEffect(() => {
    if (!slug) return;
    void touchStagePresence(slug);
    const id = window.setInterval(() => { void touchStagePresence(slug); }, 60_000);
    return () => window.clearInterval(id);
  }, [slug]);
}
