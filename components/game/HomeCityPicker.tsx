'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { WelcomePopup } from '@/components/game/WelcomePopup';
import { LandingPage } from '@/components/landing/LandingPage';
import { persistFestieStage } from '@/lib/festie/stage';
import { hydratePlayerSession } from '@/lib/player/session';
import { identifyPlayer } from '@/lib/analytics';
import { getPlayerName } from '@/lib/playerStorage';
import {
  getSessionBalloonColor,
  getServerBalloonColor,
  subscribeBalloonColor,
} from '@/lib/identity';
import { venueSlugForRoute } from '@/lib/venueRoutes';
import type { VenueRoute } from '@/lib/venueRoutes';

/** Home `/` — landing page; CTAs open welcome modal, then route into the game. */
export function HomeCityPicker() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeRoute, setWelcomeRoute] = useState<VenueRoute | undefined>();
  const [welcomeAuthIntent, setWelcomeAuthIntent] = useState<'create' | 'signin'>('create');
  const [festieName, setFestieName] = useState<string | null>(null);
  const bootedRef = useRef(false);
  const balloonColor = useSyncExternalStore(
    subscribeBalloonColor,
    getSessionBalloonColor,
    getServerBalloonColor,
  );

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    void hydratePlayerSession()
      .then(profile => {
        setFestieName(profile.festie?.name ?? profile.name ?? getPlayerName());
      })
      .catch(() => {});
  }, []);

  const openWelcome = (route?: VenueRoute, authIntent: 'create' | 'signin' = 'create') => {
    setWelcomeRoute(route);
    setWelcomeAuthIntent(authIntent);
    setShowWelcome(true);
  };

  const handleEnter = (name: string, route: VenueRoute) => {
    identifyPlayer(name);
    persistFestieStage(route);
    router.push(`/${venueSlugForRoute(route)}`);
  };

  return (
    <>
      <LandingPage
        onEnter={route => openWelcome(route, 'create')}
        onSignIn={() => openWelcome(undefined, 'signin')}
      />
      {showWelcome && (
        <WelcomePopup
          key={`${welcomeRoute ?? 'default'}-${welcomeAuthIntent}`}
          balloonColor={balloonColor}
          requireAuth
          initialAuthIntent={welcomeAuthIntent}
          initialRoute={welcomeRoute}
          initialName={festieName ?? undefined}
          onAuthSuccess={name => {
            void hydratePlayerSession().then(profile => {
              setFestieName(profile.festie?.name ?? profile.name ?? name);
            });
          }}
          onEnter={handleEnter}
        />
      )}
    </>
  );
}
