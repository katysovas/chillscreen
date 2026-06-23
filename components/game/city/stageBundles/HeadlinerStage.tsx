'use client';

import { useLandingHero } from '@/components/landing/LandingHeroContext';
import { creatorTemplateLiveOnTile } from './liveTile';
import { HeadlinerVideoScreen } from './HeadlinerVideoScreen';
import type { MidTileRenderProps } from './types';

export function HeadlinerStage(props: MidTileRenderProps) {
  const landingHero = useLandingHero();

  return (
    <HeadlinerVideoScreen live={!landingHero && creatorTemplateLiveOnTile(props)} />
  );
}
