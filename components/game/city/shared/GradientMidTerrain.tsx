import {
  HILL_MAIN_PATH,
  MID_HILL,
  MID_SHORE,
  MID_SKY,
  RIDGE_PATH,
  SHORE_PATH,
  SKY_PATH,
} from './terrainPaths';

type GradientMidTerrainProps = {
  tileIndex: number;
};

/** Shared smooth hills/sky — one palette everywhere (no tile-edge color shifts). */
export function GradientMidTerrain({ tileIndex }: GradientMidTerrainProps) {
  const uid = `t${tileIndex}`;

  return (
    <g>
      <defs>
        <linearGradient
          id={`sky-top-${uid}`}
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={360}
          x2={0}
          y2={540}
        >
          <stop offset="0%" stopColor={MID_SKY} stopOpacity={0} />
          <stop offset="55%" stopColor={MID_SKY} stopOpacity={0.55} />
          <stop offset="100%" stopColor={MID_SKY} stopOpacity={1} />
        </linearGradient>
      </defs>
      <path d={SKY_PATH} fill={MID_SKY} />
      <path d={SKY_PATH} fill={`url(#sky-top-${uid})`} />
      <path d={HILL_MAIN_PATH} fill={MID_HILL} />
      <path d={SHORE_PATH} fill={MID_SHORE} opacity={0.92} />
      <path d={RIDGE_PATH} fill={MID_HILL} opacity={0.5} />
    </g>
  );
}
