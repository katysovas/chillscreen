'use client';

import { ChillForestLayer } from '../chill';
import { StageToiletsFlanking } from '../street/StageToiletRow';
import { CHILL_STAGE_MID_X, CHILL_STAGE_TOILET_HALF } from '../chill';
import { useLandingHero } from '@/components/landing/LandingHeroContext';

export function CreatorChillTileBody() {
  const landingHero = useLandingHero();

  return (
    <>
      <ChillForestLayer />
      {!landingHero && (
        <StageToiletsFlanking
          centerX={CHILL_STAGE_MID_X}
          stageHalfWidth={CHILL_STAGE_TOILET_HALF}
        />
      )}
    </>
  );
}
