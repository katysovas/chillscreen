import type { VenueRoute } from '@/lib/venueRoutes';
import type { VenueFocus } from '../cityVenues/types';

/** Props passed to code-split mid-layer tile renderers for one city tile. */
export type MidTileRenderProps = {
  tileIndex: number;
  vx: number;
  hideTrees: boolean;
  deepLinkRoute?: VenueRoute;
  cinemaLive: number;
  concertLive: number;
  coachellaLive: number;
  edcLive: number;
  whichStageLive: number;
  forestLive: number;
  silentDiscoLive: number;
  focus: VenueFocus;
  cinemaFoW: number;
  cinemaFoH: number;
  cinemaFoY: number;
  concertFoW: number;
  concertFoH: number;
  concertFoY: number;
};

export type StageMidBundle = {
  /** City tile art inside the scaled `<g>`. */
  CityTileBody: (props: MidTileRenderProps) => React.ReactNode;
  /** Foreground stage (festival stages on separate parallax layer). */
  CityTileForeground?: (props: MidTileRenderProps) => React.ReactNode;
  /** Arch / truss labels above sky (Tentaroo only). */
  CityTileSkyLabels?: (props: { tileIndex: number }) => React.ReactNode;
  /** Toilet overflow on the east town connector tile. */
  NeighborOverflow?: (props: { tileIndex: number }) => React.ReactNode;
};

export type StageMidBundleModule = { bundle: StageMidBundle };
