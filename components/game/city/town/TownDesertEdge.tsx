import { MID_GND, MID_HILL, MID_W } from '../shared/terrainPaths';
import { DESERT_FAR, DESERT_MID, DESERT_NEAR } from '../sandiego/constants';

type TownDesertEdgeProps = {
  tileIndex: number;
};

/** Warm foothills on the east edge of the SF→SD town — blends green hills into San Diego desert. */
export function TownDesertEdge({ tileIndex }: TownDesertEdgeProps) {
  const uid = `tde${tileIndex}`;
  const x0 = 980;

  return (
    <g>
      <defs>
        <linearGradient
          id={`${uid}-hill`}
          gradientUnits="userSpaceOnUse"
          x1={x0}
          y1={0}
          x2={MID_W}
          y2={0}
        >
          <stop offset="0%" stopColor={MID_HILL} stopOpacity={0} />
          <stop offset="18%" stopColor={MID_HILL} stopOpacity={0.55} />
          <stop offset="100%" stopColor={DESERT_NEAR} stopOpacity={0.92} />
        </linearGradient>
        <linearGradient
          id={`${uid}-ridge`}
          gradientUnits="userSpaceOnUse"
          x1={x0 + 180}
          y1={0}
          x2={MID_W}
          y2={0}
        >
          <stop offset="0%" stopColor={DESERT_MID} stopOpacity={0} />
          <stop offset="100%" stopColor={DESERT_FAR} stopOpacity={0.88} />
        </linearGradient>
      </defs>

      <path
        d={`M${x0},504
          C${x0 + 280},498 ${x0 + 620},492 ${MID_W - 420},488
          C${MID_W - 180},486 ${MID_W},484 ${MID_W},504
          L${MID_W},900 L${x0},900 Z`}
        fill={`url(#${uid}-hill)`}
      />
      <path
        d={`M${x0 + 320},520
          L${x0 + 620},470 ${x0 + 980},430 ${MID_W - 280},400
          L${MID_W},440 L${MID_W},900 L${x0 + 240},900 Z`}
        fill={`url(#${uid}-ridge)`}
      />
      <path
        d={`M${x0 + 520},536
          C${x0 + 900},528 ${x0 + 1300},522 ${MID_W},518
          L${MID_W},900 L${x0 + 520},900 Z`}
        fill={DESERT_NEAR}
        opacity={0.42}
      />
      {/* Dry scrub strip along the ground line */}
      <path
        d={`M${x0 + 80},${MID_GND + 6}
          Q${x0 + 420},${MID_GND - 2} ${MID_W * 0.62},${MID_GND + 4}
          Q${MID_W * 0.86},${MID_GND + 10} ${MID_W},${MID_GND + 2}
          L${MID_W},900 L${x0 + 80},900 Z`}
        fill="#9a9080"
        opacity={0.35}
      />
    </g>
  );
}
