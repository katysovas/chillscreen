'use client';

import dynamic from 'next/dynamic';
import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { WelcomePopup } from './WelcomePopup';
import { persistFestieStage, venueRouteForStageSlug } from '@/lib/festie/stage';
import { hydratePlayerSession } from '@/lib/player/session';
import { identifyPlayer } from '@/lib/analytics';
import { getPlayerName } from '@/lib/playerStorage';
import { randomPreviewCityRoute, stageWorldOffForRoute } from '@/lib/isolatedCity';
import { setAudioMuted } from '@/lib/audioMute';
import {
  getSessionBalloonColor,
  getServerBalloonColor,
  subscribeBalloonColor,
} from '@/lib/identity';
import { venueSlugForRoute } from '@/lib/venueRoutes';
import type { VenueRoute } from '@/lib/venueRoutes';

const SFCityLoader = dynamic(() => import('./SFCityLoader'), {
  ssr: false,
  loading: () => null,
});

type BootPhase = 'loading' | 'guest' | 'redirecting';

/** Home `/` — resolve auth first, then one stage backdrop + city picker overlay. */
export function HomeCityPicker() {
  const router = useRouter();
  const [clientReady, setClientReady] = useState(false);
  const [phase, setPhase] = useState<BootPhase>('loading');
  const [previewRoute, setPreviewRoute] = useState<VenueRoute | null>(null);
  const [muted, setMuted] = useState(false);
  const [festieName, setFestieName] = useState<string | null>(null);
  const bootedRef = useRef(false);
  const balloonColor = useSyncExternalStore(
    subscribeBalloonColor,
    getSessionBalloonColor,
    getServerBalloonColor,
  );

  useEffect(() => {
    setClientReady(true);
  }, []);

  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    void (async () => {
      try {
        const profile = await hydratePlayerSession();
        setFestieName(profile.festie?.name ?? profile.name ?? getPlayerName());

        if (profile.authenticated && profile.festie) {
          const route = venueRouteForStageSlug(profile.festie.stage_slug);
          if (route) {
            identifyPlayer(profile.festie.name);
            setPhase('redirecting');
            router.replace(`/${venueSlugForRoute(route)}`);
            return;
          }
        }

        setPreviewRoute(randomPreviewCityRoute());
        setPhase('guest');
      } catch {
        setPreviewRoute(randomPreviewCityRoute());
        setPhase('guest');
      }
    })();
  }, [router]);

  useEffect(() => {
    setAudioMuted(muted);
  }, [muted]);

  const handleEnter = (name: string, route: VenueRoute) => {
    identifyPlayer(name);
    persistFestieStage(route);
    router.push(`/${venueSlugForRoute(route)}`);
  };

  if (!clientReady || phase !== 'guest' || previewRoute == null) {
    return null;
  }

  return (
    <>
      <SFCityLoader
        venueRoute={previewRoute}
        spawnWorldOff={stageWorldOffForRoute(previewRoute)}
        homePreview
        muted={muted}
        serverBootOverlay
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
      <WelcomePopup
        balloonColor={balloonColor}
        requireAuth
        initialName={festieName ?? undefined}
        onAuthSuccess={name => {
          void hydratePlayerSession().then(profile => {
            setFestieName(profile.festie?.name ?? profile.name ?? name);
          });
        }}
        onEnter={handleEnter}
      />
    </>
  );
}
