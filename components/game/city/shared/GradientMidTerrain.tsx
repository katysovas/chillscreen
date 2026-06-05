import { worldTileKind, type WorldTileKind } from '@/lib/worldTiles';
import { blendHex } from '../transition/blendColors';
import {
  HILL_MAIN_PATH,
  MID_GND,
  MID_W,
  RIDGE_PATH,
  SHORE_PATH,
  SKY_PATH,
  SEA_HILL,
  SEA_SHORE,
  SEA_SKY,
  SF_HILL,
  SF_SHORE,
  SF_SKY,
  TOWN_HILL,
  TOWN_SHORE,
  TOWN_SKY,
} from './terrainPaths';

type GradientMidTerrainProps = {
  tileIndex: number;
};

type Palette = { sky: string; hill: string; shore: string };

function paletteFor(kind: WorldTileKind): Palette {
  if (kind === 'sf') return { sky: SF_SKY, hill: SF_HILL, shore: SF_SHORE };
  if (kind === 'seattle') return { sky: SEA_SKY, hill: SEA_HILL, shore: SEA_SHORE };
  return { sky: TOWN_SKY, hill: TOWN_HILL, shore: TOWN_SHORE };
}

function edgeColors(tileIndex: number) {
  const kind = worldTileKind(tileIndex);
  const left = worldTileKind(tileIndex - 1);
  const right = worldTileKind(tileIndex + 1);
  const center = paletteFor(kind);
  const leftP = paletteFor(left);
  const rightP = paletteFor(right);

  return {
    sky: { c: center.sky, l: leftP.sky, r: rightP.sky },
    hill: { c: center.hill, l: leftP.hill, r: rightP.hill },
    shore: { c: center.shore, l: leftP.shore, r: rightP.shore },
    leftOther: left !== kind,
    rightOther: right !== kind,
    kind,
    left,
    right,
  };
}

/** Wide curved wash when terrain type changes (city ↔ countryside). */
function EdgeHillWash({
  uid,
  side,
  left,
  right,
}: {
  uid: string;
  side: 'left' | 'right';
  left: WorldTileKind;
  right: WorldTileKind;
}) {
  const from = paletteFor(side === 'left' ? left : right);
  const to = paletteFor(side === 'left' ? right : left);
  const wash = blendHex(from.hill, to.hill, 0.5);
  const gradId = `ew-${side}-${uid}`;

  const path =
    side === 'left'
      ? `M0,400 Q420,368 900,392 Q1500,418 2100,432 C2350,442 ${MID_W},448
         L${MID_W},900 L0,900 Z`
      : `M0,448 C250,452 700,430 1100,408 Q1700,388 2200,400 L${MID_W},400
         Q${MID_W - 480},${MID_GND - 72} ${MID_W - 120},${MID_GND - 20}
         L${MID_W},900 L0,900 Z`;

  return (
    <>
      <defs>
        <linearGradient
          id={gradId}
          gradientUnits="userSpaceOnUse"
          x1={side === 'left' ? 0 : MID_W}
          y1={0}
          x2={side === 'left' ? 920 : MID_W - 920}
          y2={0}
        >
          <stop offset="0%" stopColor={wash} stopOpacity={0.38} />
          <stop offset="100%" stopColor={wash} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={path} fill={`url(#${gradId})`} />
    </>
  );
}

/** Shared smooth hills/sky with horizontal blends at tile boundaries. */
export function GradientMidTerrain({ tileIndex }: GradientMidTerrainProps) {
  const { sky, hill, shore, leftOther, rightOther, left, right } = edgeColors(tileIndex);
  const uid = `t${tileIndex}`;

  return (
    <g>
      <defs>
        <linearGradient id={`sky-${uid}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={MID_W} y2={0}>
          <stop offset="0%" stopColor={sky.l} />
          <stop offset="22%" stopColor={sky.c} />
          <stop offset="78%" stopColor={sky.c} />
          <stop offset="100%" stopColor={sky.r} />
        </linearGradient>
        <linearGradient
          id={`sky-top-${uid}`}
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={360}
          x2={0}
          y2={540}
        >
          <stop offset="0%" stopColor={sky.c} stopOpacity={0} />
          <stop offset="55%" stopColor={sky.c} stopOpacity={0.55} />
          <stop offset="100%" stopColor={sky.c} stopOpacity={1} />
        </linearGradient>
        <linearGradient id={`hill-${uid}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={MID_W} y2={0}>
          <stop offset="0%" stopColor={hill.l} />
          <stop offset="22%" stopColor={hill.c} />
          <stop offset="78%" stopColor={hill.c} />
          <stop offset="100%" stopColor={hill.r} />
        </linearGradient>
        <linearGradient id={`shore-${uid}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={MID_W} y2={0}>
          <stop offset="0%" stopColor={shore.l} />
          <stop offset="22%" stopColor={shore.c} />
          <stop offset="82%" stopColor={shore.c} />
          <stop offset="100%" stopColor={shore.r} />
        </linearGradient>
        <linearGradient id={`ridge-${uid}`} gradientUnits="userSpaceOnUse" x1={0} y1={0} x2={MID_W} y2={0}>
          <stop offset="0%" stopColor={hill.l} stopOpacity={0.45} />
          <stop offset="50%" stopColor={hill.c} stopOpacity={0.55} />
          <stop offset="100%" stopColor={hill.r} stopOpacity={0.45} />
        </linearGradient>
      </defs>
      <path d={SKY_PATH} fill={`url(#sky-${uid})`} />
      <path d={SKY_PATH} fill={`url(#sky-top-${uid})`} />
      <path d={HILL_MAIN_PATH} fill={`url(#hill-${uid})`} />
      <path d={SHORE_PATH} fill={`url(#shore-${uid})`} opacity={0.92} />
      <path d={RIDGE_PATH} fill={`url(#ridge-${uid})`} />
      {leftOther && <EdgeHillWash uid={uid} side="left" left={left} right={right} />}
      {rightOther && <EdgeHillWash uid={uid} side="right" left={left} right={right} />}
    </g>
  );
}
