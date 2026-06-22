'use client';

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import { bootstrapStageSyncFromApi } from '@/lib/stageClock';
import { stageChannelForRoute } from '@/lib/isolatedCity';
import {
  preloadLandingHeroAssets,
  warmLandingHeroSFCity,
} from '@/lib/landing/preloadLandingHero';
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
  /** Landing-page hero — lightweight preload, no full-screen boot shell. */
  landingHero?: boolean;
  onSceneReady?: () => void;
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

async function importSFCityForLoader(landingHero?: boolean) {
  if (!landingHero) return importSFCity();
  try {
    return await warmLandingHeroSFCity();
  } catch (err) {
    if (isStaleChunkError(err) && reloadForStaleChunk()) {
      return new Promise<typeof import('./SFCity')>(() => {});
    }
    throw err;
  }
}

function preloadForLoader(venueRoute: VenueRoute, landingHero?: boolean): Promise<void> {
  return landingHero
    ? preloadLandingHeroAssets()
    : preloadStageRouteAssets(venueRoute);
}

/** Code-split entry — keeps the main route JS small until the game is needed. */
export default function SFCityLoader({
  spawnWorldOff,
  venueRoute,
  homePreview,
  muted,
  serverBootOverlay = false,
  landingHero = false,
  onSceneReady,
}: SFCityLoaderProps) {
  const [Game, setGame] = useState<SFCityComponent | null>(null);
  const [mounted, setMounted] = useState(false);
  const [showShell, setShowShell] = useState(false);
  const [shellVisible, setShellVisible] = useState(false);
  const [debugPin, setDebugPin] = useState(false);
  const loadedRef = useRef(false);
  const sceneReadyRef = useRef(false);

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
    if (landingHero) {
      void preloadLandingHeroAssets();
      return;
    }
    const channel = stageChannelForRoute(venueRoute);
    bootstrapStageSyncFromApi(channel);
    void preloadStageRouteAssets(venueRoute);
  }, [venueRoute, landingHero]);

  useEffect(() => {
    if (!mounted) return;

    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    let raf = 0;
    let cancelled = false;

    setDebugPin(keepVenueBootOverlay());

    if (!serverBootOverlay && !landingHero) {
      setShowShell(true);
      raf = requestAnimationFrame(() => {
        if (!cancelled) setShellVisible(true);
      });
    }

    Promise.all([
      importSFCityForLoader(landingHero),
      preloadForLoader(venueRoute, landingHero),
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
      } else if (!landingHero) {
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
  }, [mounted, venueRoute, serverBootOverlay, landingHero]);

  useEffect(() => {
    if (!Game || !landingHero || sceneReadyRef.current) return;
    sceneReadyRef.current = true;
    onSceneReady?.();
  }, [Game, landingHero, onSceneReady]);

  const renderClientShell = mounted && !serverBootOverlay && !landingHero && (showShell || debugPin);

  return (
    <>
      {(!landingHero || Game) && <GameCharacterStyles />}
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
