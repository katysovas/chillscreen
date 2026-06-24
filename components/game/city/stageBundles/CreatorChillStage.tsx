'use client';

import { ChillStage } from '../chill';
import { CHILL_MID_TILE_W, LANDING_HERO_GRASS_PAINT_TOP } from '../chill/constants';
import { GrassGround } from '../GroundLayer';
import { useLandingHero } from '@/components/landing/LandingHeroContext';
import { creatorTemplateLiveOnTile } from './liveTile';
import type { MidTileRenderProps } from './types';

export function CreatorChillStage(props: MidTileRenderProps) {
  const landingHero = useLandingHero();

  return (
    <>
      {landingHero && (
        <GrassGround
          w={CHILL_MID_TILE_W}
          tile={0}
          dropY={0}
          topOverride={LANDING_HERO_GRASS_PAINT_TOP}
          skipTopSeam
        />
      )}
      <ChillStage
        live={!landingHero && creatorTemplateLiveOnTile(props)}
        heroScreen={landingHero}
      />
    </>
  );
}
