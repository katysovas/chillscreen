'use client';

import { useEffect, useState } from 'react';
import SFCityLoader from '@/components/game/SFCityLoader';
import { VenueBootOverlay } from '@/components/game/VenueBootOverlay';
import { CreatorStageProvider } from '@/lib/stages/CreatorStageContext';
import { venueRouteForUserStage } from '@/lib/stages/runtime';
import type { UserStagePublic } from '@/lib/stages/types';
import { worldOffForVenueRoute } from '@/lib/venueRoutes';
import { getPlayerSession, hydratePlayerSession, subscribePlayerSession } from '@/lib/player/session';

type Props = {
  stage: UserStagePublic;
};

export function UserStageShell({ stage }: Props) {
  const venueRoute = venueRouteForUserStage(stage);
  const spawnWorldOff = worldOffForVenueRoute(venueRoute);
  const [ownerUserId, setOwnerUserId] = useState<string | null>(() => getPlayerSession().userId);

  useEffect(() => {
    void hydratePlayerSession();
    return subscribePlayerSession(() => {
      setOwnerUserId(getPlayerSession().userId);
    });
  }, []);

  return (
    <CreatorStageProvider
      initialStage={stage}
      ownerUserId={stage.ownerId}
      currentUserId={ownerUserId}
    >
      <VenueBootOverlay />
      <SFCityLoader
        spawnWorldOff={spawnWorldOff}
        venueRoute={venueRoute}
        serverBootOverlay
      />
    </CreatorStageProvider>
  );
}
