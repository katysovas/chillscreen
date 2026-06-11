'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import SFCityLoader from './SFCityLoader';
import { WelcomePopup } from './WelcomePopup';
import { fetchAuthMe } from '@/lib/festie/client';
import { hydratePlayerSession } from '@/lib/player/session';
import { identifyPlayer } from '@/lib/analytics';
import { getPlayerName } from '@/lib/playerStorage';
import { randomPreviewCityRoute, stageWorldOffForRoute, ISOLATED_CITY_ORDER } from '@/lib/isolatedCity';
import { setAudioMuted } from '@/lib/audioMute';
import {
  getSessionBalloonColor,
  getServerBalloonColor,
  subscribeBalloonColor,
} from '@/lib/identity';
import { venueSlugForRoute } from '@/lib/venueRoutes';
import type { VenueRoute } from '@/lib/venueRoutes';

const SSR_PREVIEW_ROUTE = ISOLATED_CITY_ORDER[0]!;

/** Home `/` — random stage backdrop + city picker overlay. */
export function HomeCityPicker() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [previewRoute, setPreviewRoute] = useState<VenueRoute>(SSR_PREVIEW_ROUTE);
  const [muted, setMuted] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [festieName, setFestieName] = useState<string | null>(null);
  const balloonColor = useSyncExternalStore(
    subscribeBalloonColor,
    getSessionBalloonColor,
    getServerBalloonColor,
  );

  useEffect(() => {
    setPreviewRoute(randomPreviewCityRoute());
    setMounted(true);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        const profile = await hydratePlayerSession();
        const { authenticated } = await fetchAuthMe();
        setIsSignedIn(authenticated);
        setFestieName(profile.name ?? getPlayerName());
      } catch {
        setIsSignedIn(false);
      } finally {
        setAuthReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    setAudioMuted(muted);
  }, [muted]);

  const handleEnter = (name: string, route: VenueRoute) => {
    identifyPlayer(name);
    router.push(`/${venueSlugForRoute(route)}`);
  };

  const route = mounted ? previewRoute : SSR_PREVIEW_ROUTE;

  return (
    <>
      <SFCityLoader
        key={route}
        venueRoute={route}
        spawnWorldOff={stageWorldOffForRoute(route)}
        homePreview
        muted={muted}
      />
      <button
        type="button"
        onClick={() => setMuted(m => !m)}
        title={muted ? 'Unmute' : 'Mute'}
        aria-label={muted ? 'Unmute stage audio' : 'Mute stage audio'}
        style={{
          position: 'fixed',
          top: 'max(16px, env(safe-area-inset-top))',
          right: 16,
          width: 40,
          height: 40,
          borderRadius: 10,
          border: '1px solid rgba(255,255,255,0.22)',
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          color: muted ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.85)',
          fontSize: 18,
          cursor: 'pointer',
          zIndex: 1001,
        }}
      >
        {muted ? '🔇' : '🔊'}
      </button>
      {authReady && (
        <WelcomePopup
          balloonColor={balloonColor}
          requireAuth={!isSignedIn}
          pickStageOnly={isSignedIn}
          initialName={festieName ?? undefined}
          onAuthSuccess={name => {
            void hydratePlayerSession().then(profile => {
              setIsSignedIn(profile.authenticated);
              setFestieName(profile.name ?? name);
            });
          }}
          onEnter={handleEnter}
        />
      )}
    </>
  );
}
