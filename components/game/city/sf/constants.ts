/** San Francisco mid-layer matches the shared city tile geometry. */
export const SF_GND = 660;
export const SF_MID_TILE_W = 2600;
export const SF_MID_TILE_H = 900;

/**
 * Outside Lands / concert rig center — west enough to frame the Golden Gate
 * (x≈8–446) and the painted-lady row (x≈1048–1328) in the static viewport.
 */
export const SF_CONCERT_MID_X = 760;

/**
 * Chill Cinema rig center — east SF band with downtown skyline in the static viewport.
 */
export const CINEMA_STATIC_MID_X = 2050;

/** Mid-layer slice when the camera is fixed on the stage (matches lib/venues VIEW_*). */
export const SF_STATIC_VIEWPORT_X = SF_CONCERT_MID_X - 700;
export const CINEMA_STATIC_VIEWPORT_X = CINEMA_STATIC_MID_X - 700;
export const SF_STATIC_VIEWPORT_W = 1400;

/** Fallback fill behind landmarks — foggy bay sky tone. */
export const SF_BACKDROP_FILL = '#a8c4dc';

/** Grass + sidewalk props sit this many px lower than default GND_Y. */
export const SF_GRASS_DROP_Y = 30;

/** Porta-potties sit this many px below the default sidewalk Y. */
export const SF_TOILET_DROP_Y = 40;
