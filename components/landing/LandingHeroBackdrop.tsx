'use client';

import SFCityLoader from '@/components/game/SFCityLoader';
import { LandingHeroProvider } from './LandingHeroContext';

const LANDING_HERO_VENUE = 'creator-chill' as const;

/** Nature stage (parallax forest + rig) as the landing hero backdrop — no video player. */
export function LandingHeroBackdrop() {
  return (
    <LandingHeroProvider active>
      <div className="hero-backdrop" aria-hidden>
        <SFCityLoader venueRoute={LANDING_HERO_VENUE} homePreview muted />
      </div>
    </LandingHeroProvider>
  );
}
