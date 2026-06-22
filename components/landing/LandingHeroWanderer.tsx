'use client';

import NPC from '@/components/game/NPC';
import type { CharacterDef } from '@/components/game/characters';

type Props = {
  wanderer: CharacterDef;
};

/** One ambient festie wandering the grass on the landing hero. */
export function LandingHeroWanderer({ wanderer }: Props) {
  return (
    <NPC
      characterId={wanderer.id}
      index={0}
      {...wanderer}
      stageAnchor={undefined}
      stageCrowd={undefined}
      paused={false}
      greeting={false}
      greetFacing="right"
    />
  );
}
