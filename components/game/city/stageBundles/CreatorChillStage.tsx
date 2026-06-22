'use client';

import { ChillStage } from '../chill';
import { useLandingHero } from '@/components/landing/LandingHeroContext';
import { creatorTemplateLiveOnTile } from './liveTile';
import type { MidTileRenderProps } from './types';

export function CreatorChillStage(props: MidTileRenderProps) {
  const landingHero = useLandingHero();

  return (
    <ChillStage
      live={!landingHero && creatorTemplateLiveOnTile(props)}
      heroScreen={landingHero}
    />
  );
}
