import {
  forestStageMidX,
  isVenueInView,
  silentDiscoStageMidX,
  whichStageMidX,
} from '@/lib/venues';
import { isForestTile, isSilentDiscoTile, isTentarooTile } from '@/lib/worldTiles';
import { WHICH_STAGE_HALF } from '../tentaroo/constants';
import { FOREST_STAGE_HALF } from '../forest/constants';
import { SILENT_DISCO_STAGE_HALF } from '../silent-disco/constants';
import type { VenueRoute } from '@/lib/venueRoutes';
import { isVenueLive } from '@/lib/venueRoutes';
import type { VenueFocus } from '../cityVenues/types';

type LiveArgs = {
  tileIndex: number;
  vx: number;
  cinemaLive: number;
  concertLive: number;
  coachellaLive: number;
  edcLive: number;
  whichStageLive: number;
  forestLive: number;
  silentDiscoLive: number;
  focus: VenueFocus;
  deepLinkRoute?: VenueRoute;
};

export function edcLiveOnTile({
  tileIndex: t,
  cinemaLive,
  concertLive,
  coachellaLive,
  edcLive,
  whichStageLive,
  forestLive,
  silentDiscoLive,
  focus,
  deepLinkRoute,
}: LiveArgs): boolean {
  return isVenueLive(
    'edc', t, cinemaLive, concertLive, coachellaLive, edcLive, whichStageLive, forestLive, silentDiscoLive, focus, deepLinkRoute,
  );
}

export function coachellaLiveOnTile({
  tileIndex: t,
  cinemaLive,
  concertLive,
  coachellaLive,
  edcLive,
  whichStageLive,
  forestLive,
  silentDiscoLive,
  focus,
  deepLinkRoute,
}: LiveArgs): boolean {
  return isVenueLive(
    'coachella', t, cinemaLive, concertLive, coachellaLive, edcLive, whichStageLive, forestLive, silentDiscoLive, focus, deepLinkRoute,
  );
}

export function whichStageLiveOnTile(args: LiveArgs): boolean {
  const { tileIndex: t, vx } = args;
  if (!isTentarooTile(t)) return false;
  const midX = whichStageMidX(t);
  if (midX != null && isVenueInView(vx, t, midX, WHICH_STAGE_HALF)) {
    return true;
  }
  return isVenueLive(
    'which-stage', t, args.cinemaLive, args.concertLive, args.coachellaLive, args.edcLive, args.whichStageLive, args.forestLive, args.silentDiscoLive, args.focus, args.deepLinkRoute,
  );
}

export function forestLiveOnTile(args: LiveArgs): boolean {
  const { tileIndex: t, vx } = args;
  if (!isForestTile(t)) return false;
  const midX = forestStageMidX(t);
  if (midX != null && isVenueInView(vx, t, midX, FOREST_STAGE_HALF)) {
    return true;
  }
  return isVenueLive(
    'forest', t, args.cinemaLive, args.concertLive, args.coachellaLive, args.edcLive, args.whichStageLive, args.forestLive, args.silentDiscoLive, args.focus, args.deepLinkRoute,
  );
}

export function silentDiscoLiveOnTile(args: LiveArgs): boolean {
  const { tileIndex: t, vx } = args;
  if (!isSilentDiscoTile(t)) return false;
  const midX = silentDiscoStageMidX(t);
  if (midX != null && isVenueInView(vx, t, midX, SILENT_DISCO_STAGE_HALF)) {
    return true;
  }
  return isVenueLive(
    'silent-disco', t, args.cinemaLive, args.concertLive, args.coachellaLive, args.edcLive, args.whichStageLive, args.forestLive, args.silentDiscoLive, args.focus, args.deepLinkRoute,
  );
}
