/** Seattle mid-layer matches SF tile geometry. */
export const SEATTLE_GND = 660;
export const SEATTLE_TILE_W = 2600;
export const SEATTLE_MID_TILE_H = 900;

/** Bumbershoot / concert rig center on Seattle tiles. */
export const SEATTLE_CONCERT_MID_X = 880;

/**
 * Rainier snow-cap target in static view — east of the concert rig so the peak
 * sits in open sky (centering on the stage hides it behind the truss).
 */
export const SEATTLE_RAINIER_PEAK_TARGET_X = 1420;

/** Mid-layer slice when the camera is fixed on the stage (matches lib/venues VIEW_*). */
export const SEATTLE_STATIC_VIEWPORT_X = SEATTLE_CONCERT_MID_X - 700;
export const SEATTLE_STATIC_VIEWPORT_W = 1400;

/** Fallback fill behind landmarks — Pacific Northwest sky tone. */
export const SEATTLE_BACKDROP_FILL = '#b4cee4';

/** Grass + sidewalk props sit this many px lower than default GND_Y. */
export const SEATTLE_GRASS_DROP_Y = 30;

/** Porta-potties sit this many px below the default sidewalk Y. */
export const SEATTLE_TOILET_DROP_Y = 40;
