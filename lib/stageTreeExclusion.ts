import { worldTileSlot } from './worldTiles';
import { gndOriginForTile } from './worldTileGeometry';
import { VIEW_WIDTH } from './venues';
import { isStaticCityTemplateRoute, type VenueRoute } from './venueSlugs';

const SF_SLOT = 0;
const SF_VEGAS_TOWN = 1;
const VEGAS_SLOT = 2;
const VEGAS_SD_TOWN = 3;
const SOCAL_SLOT = 4;
const SOCAL_TENTAROO_TOWN = 5;
const TENTAROO_SLOT = 6;
const TENTAROO_FOREST_TOWN = 7;
const FOREST_SLOT = 8;
const FOREST_SILENT_DISCO_TOWN = 9;
const SILENT_DISCO_SLOT = 10;
const SILENT_DISCO_SEATTLE_TOWN = 11;
const SEATTLE_SLOT = 12;
const SEATTLE_EAST_TOWN = 13;

/** City ground tiles are full-width; towns use TOWN_GND_W. */
const CITY_GND_MIN = 3000;

/** Static city — keep sidewalk trees / lamps only near the viewport edges. */
export const STATIC_GROUND_EDGE_KEEP_PX = 280;

export type GroundStreetSkipContext = {
  route?: VenueRoute;
  /** Fixed-camera ground scroll offset (GND_F = 1). */
  cameraOff?: number;
};

function skipStaticCityCenterProp(tileIndex: number, propX: number, cameraOff: number): boolean {
  const worldX = gndOriginForTile(tileIndex) + propX;
  const innerLeft = cameraOff + STATIC_GROUND_EDGE_KEEP_PX;
  const innerRight = cameraOff + VIEW_WIDTH - STATIC_GROUND_EDGE_KEEP_PX;
  return worldX >= innerLeft && worldX <= innerRight;
}

/** Ground-x band where a stage sits — shared by trees, lamps, benches, etc. */
function groundStageBand(tileIndex: number, propX: number, tileWidth: number): boolean {
  const slot = worldTileSlot(tileIndex);

  if (tileWidth >= CITY_GND_MIN) {
    switch (slot) {
      case SF_SLOT:
        return (propX >= 720 && propX <= 1080) || (propX >= 2080 && propX <= 2780);
      case VEGAS_SLOT:
        return propX >= 2650 && propX <= 3380;
      case SOCAL_SLOT:
        return propX >= 2500 && propX <= 3280;
      case TENTAROO_SLOT:
        return propX >= 1280 && propX <= 2100;
      case FOREST_SLOT:
        return propX >= 1640 && propX <= 2520;
      case SILENT_DISCO_SLOT:
        return propX >= 1140 && propX <= 2040;
      case SEATTLE_SLOT:
        return propX >= 880 && propX <= 1580;
      default:
        return false;
    }
  }

  switch (slot) {
    case SF_VEGAS_TOWN:
      return propX >= tileWidth - 300;
    case VEGAS_SD_TOWN:
      return propX <= 260 || propX >= tileWidth - 260;
    case SOCAL_TENTAROO_TOWN:
      return propX <= 260 || propX >= tileWidth - 260;
    case TENTAROO_FOREST_TOWN:
      return propX <= 260 || propX >= tileWidth - 260;
    case FOREST_SILENT_DISCO_TOWN:
      return propX <= 260 || propX >= tileWidth - 260;
    case SILENT_DISCO_SEATTLE_TOWN:
      return propX <= 260 || propX >= tileWidth - 260;
    case SEATTLE_EAST_TOWN:
      return propX <= 300;
    default:
      return false;
  }
}

/** Parallax desync — east-band sidewalk props can sit in front of SoCal/Vegas stages. */
function parallaxStageSidewalkBand(propX: number, tileWidth: number): boolean {
  return tileWidth >= CITY_GND_MIN && propX >= 2420 && propX <= 3380;
}

/**
 * Skip a sidewalk street tree when it would sit in front of a stage on this tile.
 * Other trees on the tile are kept — only the stage footprint band is cleared.
 */
export function skipGroundStreetTree(
  tileIndex: number,
  treeX: number,
  tileWidth: number,
  ctx?: GroundStreetSkipContext,
): boolean {
  if (ctx?.route && ctx.cameraOff != null && isStaticCityTemplateRoute(ctx.route)) {
    return skipStaticCityCenterProp(tileIndex, treeX, ctx.cameraOff);
  }
  return groundStageBand(tileIndex, treeX, tileWidth)
    || parallaxStageSidewalkBand(treeX, tileWidth);
}

/** Lamp posts — same static-city center clear as trees; other props use {@link skipGroundStreetProp}. */
export function skipGroundStreetLamp(
  tileIndex: number,
  propX: number,
  tileWidth: number,
  ctx?: GroundStreetSkipContext,
): boolean {
  if (ctx?.route && ctx.cameraOff != null && isStaticCityTemplateRoute(ctx.route)) {
    return skipStaticCityCenterProp(tileIndex, propX, ctx.cameraOff);
  }
  return skipGroundStreetProp(tileIndex, propX, tileWidth);
}

/** Skip lamps, benches, hydrants, etc. in the same stage footprint band as trees. */
export function skipGroundStreetProp(tileIndex: number, propX: number, tileWidth: number): boolean {
  return groundStageBand(tileIndex, propX, tileWidth)
    || parallaxStageSidewalkBand(propX, tileWidth);
}

/** Skip a small-town mid-layer tree near the edge that faces a festival stage. */
export function skipTownMidTree(tileIndex: number, treeX: number, tileWidth: number): boolean {
  const slot = worldTileSlot(tileIndex);
  switch (slot) {
    case SF_VEGAS_TOWN:
      return treeX >= tileWidth - 200;
    case VEGAS_SD_TOWN:
      return treeX <= 110 || treeX >= tileWidth - 200;
    case SOCAL_TENTAROO_TOWN:
      return treeX <= 110 || treeX >= tileWidth - 200;
    case TENTAROO_FOREST_TOWN:
      return treeX <= 110 || treeX >= tileWidth - 200;
    case FOREST_SILENT_DISCO_TOWN:
      return treeX <= 110 || treeX >= tileWidth - 200;
    case SILENT_DISCO_SEATTLE_TOWN:
      return treeX <= 110 || treeX >= tileWidth - 200;
    case SEATTLE_EAST_TOWN:
      return treeX <= 130;
    default:
      return false;
  }
}

/** Skip SF ridge bushes that overlap the concert or cinema footprints. */
export function skipMidBush(bushX: number): boolean {
  return (bushX >= 520 && bushX <= 980) || (bushX >= 2100 && bushX <= 2580);
}
