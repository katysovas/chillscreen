'use client';

import {
  useEffect,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import { bootstrapStageSyncFromApi } from '@/lib/stageClock';
import type { VenueRoute } from '@/lib/venueRoutes';
import { StageBootShell } from './StageBootShell';

type SFCityProps = {
  spawnWorldOff?: number;
  venueRoute: VenueRoute;
  homePreview?: boolean;
  muted?: boolean;
};

type SFCityLoaderProps = SFCityProps & {
  homePreview?: boolean;
  muted?: boolean;
};

const SHELL_DELAY_MS = 700;
const FADE_MS = 320;

type SFCityComponent = ComponentType<SFCityProps>;

function GameLoadingShell({ visible }: { visible: boolean }) {
  return <StageBootShell visible={visible} />;
}

/** Code-split entry — keeps the main route JS small until the game is needed. */
export default function SFCityLoader({
  spawnWorldOff,
  venueRoute,
  homePreview,
  muted,
}: SFCityLoaderProps) {
  const [Game, setGame] = useState<SFCityComponent | null>(null);
  const [showShell, setShowShell] = useState(false);
  const [shellVisible, setShellVisible] = useState(false);
  const loadedRef = useRef(false);

  useEffect(() => {
    bootstrapStageSyncFromApi();
  }, []);

  useEffect(() => {
    let shellTimer: ReturnType<typeof setTimeout> | undefined;
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    let raf = 0;
    let cancelled = false;
    const startedAt = Date.now();

    shellTimer = setTimeout(() => {
      if (cancelled || loadedRef.current) return;
      setShowShell(true);
      raf = requestAnimationFrame(() => {
        if (!cancelled) setShellVisible(true);
      });
    }, SHELL_DELAY_MS);

    import('./SFCity').then(mod => {
      if (cancelled) return;
      loadedRef.current = true;
      setGame(() => mod.default);

      if (Date.now() - startedAt >= SHELL_DELAY_MS) {
        raf = requestAnimationFrame(() => {
          if (cancelled) return;
          setShellVisible(false);
          fadeTimer = setTimeout(() => {
            if (!cancelled) setShowShell(false);
          }, FADE_MS);
        });
      }
    });

    return () => {
      cancelled = true;
      if (shellTimer) clearTimeout(shellTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      {showShell && <GameLoadingShell visible={shellVisible} />}
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
