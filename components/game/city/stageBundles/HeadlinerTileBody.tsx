'use client';

import { StageToiletsFlanking } from '../street/StageToiletRow';
import { useLandingHero } from '@/components/landing/LandingHeroContext';
import { WHICH_STAGE_MID_X } from '../chill/constants';
import { HEADLINER_SCREEN_HALF } from './HeadlinerVideoScreen';

export function HeadlinerTileBody() {
  const landingHero = useLandingHero();

  return !landingHero ? (
    <StageToiletsFlanking
      centerX={WHICH_STAGE_MID_X}
      stageHalfWidth={HEADLINER_SCREEN_HALF}
    />
  ) : null;
}
