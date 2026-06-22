'use client';

import { useCallback, useEffect, useState } from 'react';
import SFCityLoader from '@/components/game/SFCityLoader';
import {
  LANDING_HERO_VENUE,
  preloadLandingHeroAssets,
  warmLandingHeroSFCity,
} from '@/lib/landing/preloadLandingHero';
import { LandingHeroProvider } from './LandingHeroContext';

void preloadLandingHeroAssets();
void warmLandingHeroSFCity();

/** Nature stage (parallax forest + rig) as the landing hero backdrop — no video player. */
export function LandingHeroBackdrop() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void preloadLandingHeroAssets();
    void warmLandingHeroSFCity();
  }, []);

  const onSceneReady = useCallback(() => {
    setReady(true);
  }, []);

  return (
    <LandingHeroProvider active>
      <div
        className={`hero-backdrop${ready ? ' hero-backdrop--ready' : ''}`}
        aria-hidden
      >
        <SFCityLoader
          venueRoute={LANDING_HERO_VENUE}
          homePreview
          muted
          landingHero
          onSceneReady={onSceneReady}
        />
      </div>
    </LandingHeroProvider>
  );
}
