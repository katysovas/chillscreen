'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentType,
} from 'react';
import type { VenueRoute } from '@/lib/venueRoutes';
import { getSkyPeriod, skyTheme } from '@/lib/skyTimeOfDay';

type SFCityProps = {
  spawnWorldOff?: number;
  venueRoute?: VenueRoute;
};

type SFCityLoaderProps = SFCityProps;

/** Wait this long before showing any loader UI — avoids flash on fast loads. */
const SHELL_DELAY_MS = 700;

/** Crossfade duration when handing off to the game. */
const FADE_MS = 320;

type SFCityComponent = ComponentType<SFCityProps>;

/**
 * Minimal static backdrop — matches the in-game sky, no motion.
 * Only appears on slow loads, after SHELL_DELAY_MS.
 */
function GameLoadingShell({ visible }: { visible: boolean }) {
  const skyGradient = useMemo(() => {
    const theme = skyTheme(getSkyPeriod());
    return theme.gradient.map(s => `${s.color} ${s.offset}`).join(', ');
  }, []);

  return (
    <div
      className="game-loading-shell"
      aria-hidden={!visible}
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <div
        className="game-loading-sky"
        style={{ background: `linear-gradient(180deg, ${skyGradient})` }}
      />
      <style>{`
        .game-loading-shell {
          position: fixed;
          inset: 0;
          z-index: 9999;
          background: #000;
          transition: opacity ${FADE_MS}ms ease;
        }
        .game-loading-sky {
          position: absolute;
          inset: 0;
        }
      `}</style>
    </div>
  );
}

/** Code-split entry — keeps the main route JS small until the game is needed. */
export default function SFCityLoader({ spawnWorldOff, venueRoute }: SFCityLoaderProps) {
  const [Game, setGame] = useState<SFCityComponent | null>(null);
  const [showShell, setShowShell] = useState(false);
  const [shellVisible, setShellVisible] = useState(false);
  const [gameVisible, setGameVisible] = useState(false);
  const loadedRef = useRef(false);

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

      const fastLoad = Date.now() - startedAt < SHELL_DELAY_MS;

      if (fastLoad) {
        setGame(() => mod.default);
        setGameVisible(true);
        return;
      }

      setGame(() => mod.default);
      raf = requestAnimationFrame(() => {
        if (cancelled) return;
        setGameVisible(true);
        setShellVisible(false);
        fadeTimer = setTimeout(() => {
          if (!cancelled) setShowShell(false);
        }, FADE_MS);
      });
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
        <div
          style={{
            opacity: gameVisible ? 1 : 0,
            transition: gameVisible ? `opacity ${FADE_MS}ms ease` : undefined,
          }}
        >
          <Game spawnWorldOff={spawnWorldOff} venueRoute={venueRoute} />
        </div>
      )}
    </>
  );
}
