import { MID_TILE } from '@/lib/parallax';

export const MID_GND = 660;
export const MID_W = MID_TILE;

/** Distant sky band — y=448 at both tile edges for seamless scroll. */
export const SKY_PATH = `M0,448
  C220,422 440,478 660,458
  C880,438 1100,462 1320,438
  C1580,412 1840,428 2100,448
  C2350,452 ${MID_W},448
  L${MID_W},900 L0,900 Z`;

/** Main hill crest — y=504 at both tile edges; gentle bay slope west of the bridge. */
export const HILL_MAIN_PATH = `M0,504
  C160,518 300,512 440,528
  C520,538 600,552 720,558
  C860,562 1000,548 1140,530
  C1320,512 1500,498 1720,488
  C1950,492 2200,500 ${MID_W},504
  L${MID_W},900 L0,900 Z`;

/** Shore band along the waterfront curve. */
export const SHORE_PATH = `M320,728
  Q380,698 440,672
  Q500,662 620,668
  Q780,652 920,638 1040,658
  L1040,900 L320,900 Z`;

/** Downtown / ridge foothill. */
export const RIDGE_PATH = `M1040,658
  Q1200,608 1380,628
  Q1540,644 1700,652
  Q1860,658 2020,654
  Q2180,650 2340,642
  L2340,900 L1040,900 Z`;

/** Curved bay / sound water — rounded west shore to match the inlet curve by the bridge. */
export const WATER_PATH = `M0,592
  Q120,562 260,566
  Q380,574 448,584
  Q478,586 498,602
  Q512,618 508,636
  Q502,652 488,664
  Q468,682 442,702
  Q418,722 390,738
  L360,900
  L0,900
  Q0,812 52,744
  Q28,668 0,592 Z`;

/** Unified mid-layer backdrop — same across SF, towns, and Seattle. */
export const MID_SKY = '#c0cad4';
export const MID_HILL = '#8a9a8c';
export const MID_SHORE = '#849488';

export const SF_HILL = MID_HILL;
export const SF_SHORE = MID_SHORE;
export const SF_SKY = MID_SKY;
export const SF_WATER = '#a7bbce';

/** Keep buildings east of the Golden Gate (deck ends ~x446, bay ~x520). */
export const SF_BRIDGE_CLEAR_X = 540;

export const SEA_HILL = MID_HILL;
export const SEA_SHORE = MID_SHORE;
export const SEA_SKY = MID_SKY;
export const SEA_WATER = '#8aa4b8';

export const TOWN_HILL = MID_HILL;
export const TOWN_SHORE = MID_SHORE;
export const TOWN_SKY = MID_SKY;
