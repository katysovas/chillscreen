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

type SFCityComponent = ComponentType<SFCityProps>;

/** Code-split entry — keeps the main route JS small until the game is needed. */
export default function SFCityLoader({
  spawnWorldOff,
  venueRoute,
  homePreview,
  muted,
  serverBootOverlay = false,
}: SFCityLoaderProps) {
  const [Game, setGame] = useState<SFCityComponent | null>(null);
  const [showShell, setShowShell] = useState(false);
  const [shellVisible, setShellVisible] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    const channel = stageChannelForRoute(venueRoute);
    bootstrapStageSyncFromApi(channel);
    void preloadStageRouteAssets(venueRoute);
  }, [venueRoute]);

  useEffect(() => {
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    let raf = 0;
    let cancelled = false;

    if (!serverBootOverlay) {
      setShowShell(true);
      raf = requestAnimationFrame(() => {
        if (!cancelled) setShellVisible(true);
      });
    }

    Promise.all([
      import('./SFCity'),
      preloadStageRouteAssets(venueRoute),
    ]).then(([mod]) => {
      if (cancelled) return;
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
    });

    return () => {
      cancelled = true;
      if (fadeTimer) clearTimeout(fadeTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [venueRoute, serverBootOverlay]);

  const pinBootShell = keepVenueBootOverlay() && !serverBootOverlay;

  return (
    <>
      {(pinBootShell || (!serverBootOverlay && showShell)) && (
        <StageBootShell visible={pinBootShell || shellVisible} />
      )}
      {Game && (
        <Game
          spawnWorldOff={spawnWorldOff}
          venueRoute={venueRoute}
          homePreview={homePreview}
          muted={muted}
        />
      )}
    </>
  );
}
