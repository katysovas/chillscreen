import type { VenueRoute } from '@/lib/venueSlugs';
import { stageChannelForRoute } from '@/lib/isolatedCity';
import { preloadGeneratedNpcsForChannel } from '@/lib/generatedNpcsClient';
import { preloadStagePlaylistChannel } from '@/lib/stagePlaylistClient';
import { applyLocalChannelPlaylist } from '@/lib/stageClock';
import { preloadStageMidBundle } from '@/components/game/city/stageBundles/registry';
import {
  equippedLoadoutItemIds,
  preloadLoadoutItems,
} from '@/components/game/characters/loadout';
import { getPlayerLoadout } from '@/lib/playerLoadout';
import { getSessionBalloonColor } from '@/lib/identity';

function preloadPlayerEquippedProps(): Promise<void> {
  const loadout = getPlayerLoadout(getSessionBalloonColor());
  return preloadLoadoutItems(equippedLoadoutItemIds(loadout));
}

/** Warm code + data for one isolated city route before SFCity mounts. */
export function preloadStageRouteAssets(route: VenueRoute): Promise<void> {
  const channel = stageChannelForRoute(route);
  return Promise.all([
    preloadStageMidBundle(route),
    preloadGeneratedNpcsForChannel(channel),
    preloadStagePlaylistChannel(channel).then(videos => {
      applyLocalChannelPlaylist(channel, videos);
    }),
    preloadPlayerEquippedProps(),
  ]).then(() => {});
}
