import { MID_GND, MID_W } from '../shared/terrainPaths';

type TownForestEdgeProps = {
  tileIndex: number;
};

/** Dark woodland hills on the east edge of the Farm→Forest town — blends into The Forest. */
export function TownForestEdge({ tileIndex }: TownForestEdgeProps) {
  const uid = `tfe${tileIndex}`;
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
          <stop offset="0%" stopColor="#3a6838" stopOpacity={0} />
          <stop offset="22%" stopColor="#2a4a32" stopOpacity={0.55} />
          <stop offset="100%" stopColor="#08160d" stopOpacity={0.95} />
        </linearGradient>
        <linearGradient
          id={`${uid}-glow`}
          gradientUnits="userSpaceOnUse"
          x1={x0 + 200}
          y1={0}
          x2={MID_W}
          y2={0}
        >
          <stop offset="0%" stopColor="#39ff88" stopOpacity={0} />
          <stop offset="55%" stopColor="#39ff88" stopOpacity={0.06} />
          <stop offset="100%" stopColor="#b07bff" stopOpacity={0.1} />
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
        fill={`url(#${uid}-glow)`}
      />
      <path
        d={`M${x0 + 520},536
          C${x0 + 900},528 ${x0 + 1300},522 ${MID_W},518
          L${MID_W},900 L${x0 + 520},900 Z`}
        fill="#0a1a12"
        opacity={0.5}
      />
      {/* Pine silhouettes along the ridge */}
      <g fill="#06100b" opacity={0.85}>
        <path d={`M${x0 + 420},${MID_GND} L${x0 + 432},${MID_GND - 72} L${x0 + 444},${MID_GND} Z`} />
        <path d={`M${x0 + 560},${MID_GND} L${x0 + 576},${MID_GND - 96} L${x0 + 592},${MID_GND} Z`} />
        <path d={`M${x0 + 720},${MID_GND} L${x0 + 734},${MID_GND - 80} L${x0 + 748},${MID_GND} Z`} />
        <path d={`M${x0 + 900},${MID_GND} L${x0 + 918},${MID_GND - 110} L${x0 + 936},${MID_GND} Z`} />
        <path d={`M${x0 + 1080},${MID_GND} L${x0 + 1096},${MID_GND - 88} L${x0 + 1112},${MID_GND} Z`} />
      </g>
      <path
        d={`M${x0 + 80},${MID_GND + 6}
          Q${x0 + 420},${MID_GND - 2} ${MID_W * 0.62},${MID_GND + 4}
          Q${MID_W * 0.86},${MID_GND + 10} ${MID_W},${MID_GND + 2}
          L${MID_W},900 L${x0 + 80},900 Z`}
        fill="#1a3028"
        opacity={0.38}
      />
    </g>
  );
}
