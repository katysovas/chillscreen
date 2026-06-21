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
  const [currentUserId, setCurrentUserId] = useState<string | null>(() => getPlayerSession().userId);
  const [authenticated, setAuthenticated] = useState(() => getPlayerSession().authenticated);
  const [sessionReady, setSessionReady] = useState(() => getPlayerSession().hydrated);
  const [viewerFestieName, setViewerFestieName] = useState<string | null>(() => {
    const session = getPlayerSession();
    return session.festie?.name ?? session.name;
  });

  useEffect(() => {
    void hydratePlayerSession();
    return subscribePlayerSession(() => {
      const session = getPlayerSession();
      setCurrentUserId(session.userId);
      setAuthenticated(session.authenticated);
      setSessionReady(session.hydrated);
      setViewerFestieName(session.festie?.name ?? session.name);
    });
  }, []);

  return (
    <CreatorStageProvider
      initialStage={stage}
      ownerUserId={stage.ownerId}
      currentUserId={currentUserId}
      authenticated={authenticated}
      sessionReady={sessionReady}
      viewerFestieName={viewerFestieName}
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
