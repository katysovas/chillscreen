'use client';

import SFCityLoader from '@/components/game/SFCityLoader';
import { CreateStageWizard } from './CreateStageWizard';

const CREATE_BACKDROP_ROUTE = 'creator-chill' as const;

import { GameCharacterStyles } from '@/components/game/GameCharacterStyles';

/** `/create` — live stage backdrop with the wizard modal on top. */
export function CreateStageShell() {
  return (
    <>
      <GameCharacterStyles />
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          overflow: 'hidden',
        }}
      >
        <SFCityLoader
          venueRoute={CREATE_BACKDROP_ROUTE}
          homePreview
          muted
        />
      </div>
      <CreateStageWizard />
    </>
  );
}
