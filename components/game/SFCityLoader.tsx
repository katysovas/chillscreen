'use client';

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import { bootstrapStageSyncFromApi } from '@/lib/stageClock';
import { stageChannelForRoute } from '@/lib/isolatedCity';
import { preloadStageRouteAssets } from '@/lib/stagePreload';
import { hideVenueBootOverlay, keepVenueBootOverlay } from '@/lib/venueBoot';
import type { VenueRoute } from '@/lib/venueRoutes';
import { StageBootShell } from './StageBootShell';
import { GameCharacterStyles } from './GameCharacterStyles';

type SFCityProps = {
  spawnWorldOff?: number;
  venueRoute: VenueRoute;
  homePreview?: boolean;
  muted?: boolean;
};

type SFCityLoaderProps = SFCityProps & {
  /** True when `VenueBootOverlay` is server-rendered on the page. */
  serverBootOverlay?: boolean;
};

const FADE_MS = 320;
const SF_CITY_CHUNK_RELOAD_KEY = 'sfCityChunkReload';

type SFCityComponent = ComponentType<SFCityProps>;

function isStaleChunkError(err: unknown): boolean {
  return err instanceof Error && err.message.includes('module factory is not available');
}

function reloadForStaleChunk(): boolean {
  if (
    process.env.NODE_ENV !== 'development'
    || typeof sessionStorage === 'undefined'
    || sessionStorage.getItem(SF_CITY_CHUNK_RELOAD_KEY)
  ) {
    return false;
  }
  sessionStorage.setItem(SF_CITY_CHUNK_RELOAD_KEY, '1');
  window.location.reload();
  return true;
}

/** Recover from Turbopack HMR serving a stale SFCity dependency graph. */
async function importSFCity() {
  try {
    return await import('./SFCity');
  } catch (err) {
    if (isStaleChunkError(err) && reloadForStaleChunk()) {
      return new Promise<typeof import('./SFCity')>(() => {});
    }
    throw err;
  }
}

/** Code-split entry — keeps the main route JS small until the game is needed. */
export default function SFCityLoader({
  spawnWorldOff,
  venueRoute,
  homePreview,
  muted,
  serverBootOverlay = false,
}: SFCityLoaderProps) {
  const [Game, setGame] = useState<SFCityComponent | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showShell, setShowShell] = useState(false);
  const [shellVisible, setShellVisible] = useState(false);
  const [debugPin, setDebugPin] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    const onStaleChunk = (event: PromiseRejectionEvent) => {
      if (!isStaleChunkError(event.reason)) return;
      event.preventDefault();
      reloadForStaleChunk();
    };

    window.addEventListener('unhandledrejection', onStaleChunk);
    return () => window.removeEventListener('unhandledrejection', onStaleChunk);
  }, []);

  useEffect(() => {
    const channel = stageChannelForRoute(venueRoute);
    bootstrapStageSyncFromApi(channel);
    void preloadStageRouteAssets(venueRoute);
  }, [venueRoute]);

  useEffect(() => {
    if (!mounted) return;

    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    let raf = 0;
    let cancelled = false;

    setDebugPin(keepVenueBootOverlay());

    if (!serverBootOverlay) {
      setShowShell(true);
      raf = requestAnimationFrame(() => {
        if (!cancelled) setShellVisible(true);
      });
    }

    Promise.all([
      importSFCity(),
      preloadStageRouteAssets(venueRoute),
    ]).then(([mod]) => {
      if (cancelled) return;
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.removeItem(SF_CITY_CHUNK_RELOAD_KEY);
      }
      loadedRef.current = true;
      setGame(() => mod.default);

      if (keepVenueBootOverlay()) return;

      if (serverBootOverlay) {
        hideVenueBootOverlay();
      } else {
        setShellVisible(false);
        fadeTimer = setTimeout(() => {
          if (!cancelled) setShowShell(false);
        }, FADE_MS);
      }
    }).catch((err) => {
      if (isStaleChunkError(err) && reloadForStaleChunk()) return;
      console.error('[SFCityLoader] failed to load game chunk', err);
    });

    return () => {
      cancelled = true;
      if (fadeTimer) clearTimeout(fadeTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [mounted, venueRoute, serverBootOverlay]);

  const renderClientShell = mounted && !serverBootOverlay && (showShell || debugPin);

  return (
    <>
      <GameCharacterStyles />
      {renderClientShell && (
        <StageBootShell visible={debugPin || shellVisible} />
      )}
      {Game && (
        <Game
          key={venueRoute}
          spawnWorldOff={spawnWorldOff}
          venueRoute={venueRoute}
          homePreview={homePreview}
          muted={muted}
        />
      )}
    </>
  );
}
