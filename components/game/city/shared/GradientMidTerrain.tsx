import { worldTileKind } from '@/lib/worldTiles';
import { DECORATIVE_SHAPE } from './parallaxLayerStyle';
import {
  HILL_MAIN_PATH,
  MID_HILL,
  MID_SHORE,
  RIDGE_PATH,
  SHORE_PATH,
  SKY_PATH,
} from './terrainPaths';

type GradientMidTerrainProps = {
  tileIndex: number;
};

/** Shared smooth hills/sky — one palette everywhere (no tile-edge color shifts). */
export function GradientMidTerrain({ tileIndex }: GradientMidTerrainProps) {
  const kind = worldTileKind(tileIndex);
  const showSfShore = kind === 'sf';

  return (
    <g {...DECORATIVE_SHAPE}>
      {/* No opaque sky fill here — the SkyLayer gradient shows through.
          A minimal white-haze overlay at the horizon adds depth without
          creating color-specific seams at tile boundaries. */}
      <path d={SKY_PATH} fill="rgba(255,255,255,.07)" />
      <path d={HILL_MAIN_PATH} fill={MID_HILL} />
      {showSfShore && (
        <>
          <path d={SHORE_PATH} fill={MID_SHORE} opacity={0.92} />
          <path d={RIDGE_PATH} fill={MID_HILL} opacity={0.5} />
        </>
      )}
    </g>
  );
}
