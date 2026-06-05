import { MID_W } from '../shared/terrainPaths';
import { DESERT_FAR, DESERT_MID, DESERT_NEAR } from './constants';

type SanDiegoApproachProps = {
  tileIndex: number;
};

/** Left-edge foothills continuing the SF→SD town scrub into San Diego. */
export function SanDiegoApproach({ tileIndex }: SanDiegoApproachProps) {
  const uid = `sda${tileIndex}`;
  const x1 = 920;

  return (
    <g>
      <defs>
        <linearGradient
          id={`${uid}-near`}
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={0}
          x2={x1}
          y2={0}
        >
          <stop offset="0%" stopColor={DESERT_NEAR} stopOpacity={0.95} />
          <stop offset="100%" stopColor={DESERT_NEAR} stopOpacity={0} />
        </linearGradient>
        <linearGradient
          id={`${uid}-mid`}
          gradientUnits="userSpaceOnUse"
          x1={0}
          y1={0}
          x2={x1 + 120}
          y2={0}
        >
          <stop offset="0%" stopColor={DESERT_MID} stopOpacity={0.75} />
          <stop offset="100%" stopColor={DESERT_MID} stopOpacity={0} />
        </linearGradient>
      </defs>

      <path
        d={`M0,504
          C180,500 360,496 560,492
          C720,490 860,486 ${x1},484
          L${x1},900 L0,900 Z`}
        fill={`url(#${uid}-near)`}
        shapeRendering="optimizeSpeed"
      />
      <path
        d={`M0,536
          L220,510 420,470 680,438 ${x1},418
          L${x1},900 L0,900 Z`}
        fill={`url(#${uid}-mid)`}
        shapeRendering="optimizeSpeed"
      />
      <path
        d={`M0,470 L160,430 340,450 520,420 720,440 ${x1},400
          L${x1},470 L0,504 Z`}
        fill={DESERT_FAR}
        opacity={0.55}
        shapeRendering="optimizeSpeed"
      />
    </g>
  );
}
