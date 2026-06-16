'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { WelcomePopup } from '@/components/game/WelcomePopup';
import { LandingPage } from '@/components/landing/LandingPage';
import { hydratePlayerSession } from '@/lib/player/session';
import { identifyPlayer } from '@/lib/analytics';
import { getPlayerName } from '@/lib/playerStorage';
import {
  getSessionBalloonColor,
  getServerBalloonColor,
  subscribeBalloonColor,
} from '@/lib/identity';
import { pathForStageTarget, type StagePickerTarget } from '@/lib/stagePickerOptions';
import { setLastUsedStage } from '@/lib/lastUsedStage';

/** Home `/` — landing page; stage tiles route into the game with welcome modal. */
export function HomeCityPicker() {
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);
  const [welcomeAuthIntent, setWelcomeAuthIntent] = useState<'create' | 'signin'>('signin');
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

  const scrollToStages = () => {
    document.getElementById('stages')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const openSignIn = () => {
    setWelcomeAuthIntent('signin');
    setShowWelcome(true);
  };

  const handleStageEnter = (target: StagePickerTarget) => {
    setLastUsedStage(target);
    const path = pathForStageTarget(target);
    router.push(target.kind === 'venue' ? `${path}?welcome=1` : path);
  };

  const handleEnter = (name: string, target: StagePickerTarget) => {
    identifyPlayer(name);
    setShowWelcome(false);
    setLastUsedStage(target);
    router.push(pathForStageTarget(target));
  };

  return (
    <>
      <LandingPage
        onScrollToStages={scrollToStages}
        onStageEnter={handleStageEnter}
        onSignIn={openSignIn}
      />
      {showWelcome && (
        <WelcomePopup
          key={welcomeAuthIntent}
          balloonColor={balloonColor}
          requireAuth
          initialAuthIntent={welcomeAuthIntent}
          signInFrom={{ source: 'home' }}
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
