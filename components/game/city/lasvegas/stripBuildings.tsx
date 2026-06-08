import { NEON, VEGAS_GND } from './constants';
import { DECORATIVE_SHAPE } from '../shared/parallaxLayerStyle';
import { litWindows, svgN } from './helpers';

const GND = VEGAS_GND;

export function DesertRidge() {
  return (
    <g {...DECORATIVE_SHAPE}>
      <path
        d={`M0,${GND} L0,560 L300,540 L640,560 L1000,535 L1400,558 L1850,540
            L2250,560 L2600,545 L2600,${GND} Z`}
        fill="#1c0f2e"
        opacity={0.9}
      />
      <path
        d={`M0,${GND} L0,600 L500,585 L1100,605 L1700,588 L2300,606 L2600,592 L2600,${GND} Z`}
        fill="#120a22"
      />
    </g>
  );
}

export function StratTower({ x = 150 }: { x?: number }) {
  return (
    <g>
      <polygon points={`${x - 16},${GND} ${x - 5},170 ${x + 5},170 ${x + 16},${GND}`} fill="#2a2438" />
      <polygon points={`${x},${GND} ${x},170 ${x + 5},170 ${x + 16},${GND}`} fill="rgba(0,0,0,.3)" />
      <ellipse cx={x} cy={158} rx={30} ry={14} fill="#3a3350" />
      <rect x={x - 30} y={150} width={60} height={16} fill="#2f2945" />
      <ellipse cx={x} cy={150} rx={30} ry={12} fill="#4a4368" />
      <ellipse cx={x} cy={156} rx={31} ry={6} fill="none" stroke={NEON.cyan} strokeWidth={2} opacity={0.8}>
        <animate attributeName="opacity" values="0.4;1;0.4" dur="3s" repeatCount="indefinite" />
      </ellipse>
      <rect x={x - 2} y={92} width={4} height={48} fill="#555" />
      <circle cx={x} cy={90} r={4} fill={NEON.red}>
        <animate attributeName="opacity" values="1;0.15;1" dur="1.6s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

export function LuxorPyramid({ x = 470 }: { x?: number }) {
  const apexY = 360;
  return (
    <g>
      <polygon
        points={`${x - 10},${apexY} ${x + 10},${apexY} ${x + 26},40 ${x - 26},40`}
        fill={NEON.ice}
        opacity={0.16}
      >
        <animate attributeName="opacity" values="0.08;0.22;0.08" dur="5s" repeatCount="indefinite" />
      </polygon>
      <polygon points={`${x - 130},${GND} ${x},${apexY} ${x + 130},${GND}`} fill="#141019" />
      <polygon points={`${x},${apexY} ${x + 130},${GND} ${x},${GND}`} fill="rgba(0,0,0,.45)" />
      {Array.from({ length: 7 }, (_, i) => {
        const t = (i + 1) / 8;
        return (
          <line
            key={i}
            x1={x - 130 + 130 * t}
            y1={GND}
            x2={x}
            y2={apexY + (GND - apexY) * (1 - t)}
            stroke={NEON.gold}
            strokeWidth={1}
            opacity={0.18}
          />
        );
      })}
      <circle cx={x} cy={apexY} r={5} fill={NEON.gold}>
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <g>
        <rect x={x - 210} y={620} width={70} height={40} rx={6} fill="#caa24a" />
        <rect x={x - 150} y={604} width={26} height={56} rx={6} fill="#d8b15a" />
        <rect x={x - 150} y={596} width={26} height={16} rx={5} fill="#caa24a" />
        <polygon points={`${x - 150},596 ${x - 124},596 ${x - 137},580`} fill="#b9913f" />
      </g>
    </g>
  );
}

export function EiffelReplica({ x = 760 }: { x?: number }) {
  const baseY = GND;
  const topY = 210;
  return (
    <g stroke="#6b5a3a" strokeWidth={2} fill="none">
      <path d={`M${x - 70},${baseY} Q${x - 40},460 ${x - 18},${topY}`} />
      <path d={`M${x + 70},${baseY} Q${x + 40},460 ${x + 18},${topY}`} />
      <path d={`M${x - 46},${baseY} Q${x - 26},460 ${x - 11},${topY}`} opacity={0.6} />
      <path d={`M${x + 46},${baseY} Q${x + 26},460 ${x + 11},${topY}`} opacity={0.6} />
      <path d={`M${x - 60},580 Q${x},540 ${x + 60},580`} />
      <line x1={x - 44} y1={500} x2={x + 44} y2={500} />
      <line x1={x - 26} y1={380} x2={x + 26} y2={380} />
      <line x1={x} y1={topY} x2={x} y2={170} />
      <polygon
        points={`${x - 70},${baseY} ${x},170 ${x + 70},${baseY}`}
        fill={NEON.gold}
        stroke="none"
        opacity={0.06}
      />
      <circle cx={x} cy={168} r={3} fill={NEON.gold} stroke="none">
        <animate attributeName="opacity" values="0.3;1;0.3" dur="2s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

export function Bellagio({ x = 1000 }: { x?: number }) {
  const jets = [-90, -60, -30, 0, 30, 60, 90];
  return (
    <g>
      <rect x={x - 110} y={300} width={220} height={360} fill="#2b2740" />
      <rect x={x - 110} y={300} width={220} height={360} fill="rgba(0,0,0,.18)" />
      {litWindows(x - 104, 312, 208, 300, 16, 14, NEON.ice, 3)}
      <rect x={x - 60} y={284} width={120} height={10} rx={5} fill={NEON.cyan} opacity={0.8}>
        <animate attributeName="opacity" values="0.5;1;0.5" dur="3.5s" repeatCount="indefinite" />
      </rect>
      <ellipse cx={x} cy={656} rx={170} ry={14} fill="#0c2740" opacity={0.9} />
      {jets.map((dx, i) => (
        <g key={i} transform={`translate(${x + dx},650)`}>
          <polygon points="-3,0 3,0 1.2,-150 -1.2,-150" fill={NEON.ice} opacity={0.7}>
            <animateTransform
              attributeName="transform"
              type="scale"
              values="1 0.2; 1 1; 1 0.5; 1 0.85; 1 0.2"
              dur={`${2.4 + (i % 3) * 0.5}s`}
              begin={`${i * 0.2}s`}
              repeatCount="indefinite"
              additive="sum"
            />
            <animate
              attributeName="opacity"
              values="0.2;0.85;0.4;0.7;0.2"
              dur={`${2.4 + (i % 3) * 0.5}s`}
              begin={`${i * 0.2}s`}
              repeatCount="indefinite"
            />
          </polygon>
        </g>
      ))}
    </g>
  );
}

export function VenetianCampanile({ x = 1190 }: { x?: number }) {
  return (
    <g>
      <rect x={x - 50} y={350} width={70} height={310} fill="#33304a" />
      {litWindows(x - 46, 360, 62, 290, 6, 16, NEON.gold, 2)}
      <rect x={x + 30} y={400} width={60} height={260} fill="#2c2942" />
      {litWindows(x + 34, 410, 52, 240, 5, 14, NEON.gold, 4)}
      <rect x={x - 14} y={300} width={28} height={360} fill="#b85c4a" />
      <rect x={x - 14} y={300} width={28} height={360} fill="rgba(0,0,0,.12)" />
      <rect x={x - 18} y={286} width={36} height={20} fill="#caa24a" />
      <polygon points={`${x - 18},286 ${x + 18},286 ${x},258`} fill="#3f8f6f" />
      <circle cx={x} cy={256} r={3} fill={NEON.gold}>
        <animate attributeName="opacity" values="0.4;1;0.4" dur="2.6s" repeatCount="indefinite" />
      </circle>
    </g>
  );
}

export function VegasSphere({ cx = 1470, r = 185 }: { cx?: number; r?: number }) {
  const baseY = GND;
  const dome = (rad: number) =>
    `M${cx - rad},${baseY} A${rad},${rad} 0 0 1 ${cx + rad},${baseY} Z`;
  const ey = baseY - r * 0.52;
  const chordH = [0.16, 0.34, 0.52, 0.7, 0.86].map((f) => r * f);
  const meridDx = [-0.72, -0.5, -0.26, 0, 0.26, 0.5, 0.72].map((f) => r * f);

  return (
    <g>
      {[1.4, 1.22, 1.09].map((m, i) => (
        <path key={i} d={dome(r * m)} fill={NEON.cyan} opacity={0.05}>
          <animate
            attributeName="fill"
            values={`${NEON.cyan};${NEON.pink};${NEON.violet};${NEON.cyan}`}
            dur="14s"
            repeatCount="indefinite"
          />
          <animate attributeName="opacity" values="0.02;0.09;0.02" dur={`${5 + i}s`} repeatCount="indefinite" />
        </path>
      ))}
      <path d={dome(r)} fill="#0e0b18" />
      <path d={dome(r)} fill="#f2eefb" opacity={0.97}>
        <animate
          attributeName="fill"
          values="#f2eefb;#e9f9ff;#fdeef9;#f3f6ff;#f2eefb"
          dur="18s"
          repeatCount="indefinite"
        />
      </path>
      <g transform={`translate(${cx},${ey})`}>
        <animateTransform
          attributeName="transform"
          type="translate"
          additive="sum"
          values={`0 0; ${svgN(-r * 0.16)} ${svgN(r * 0.04)}; 0 0; ${svgN(r * 0.15)} ${svgN(-r * 0.05)}; 0 0`}
          keyTimes="0;0.22;0.5;0.74;1"
          dur="10s"
          repeatCount="indefinite"
        />
        <g>
          <animateTransform
            attributeName="transform"
            type="scale"
            additive="sum"
            values="1 1; 1 1; 1 0.04; 1 1; 1 1"
            keyTimes="0;0.84;0.9;0.96;1"
            dur="6s"
            repeatCount="indefinite"
          />
          <circle cx={0} cy={0} r={r * 0.42} fill={NEON.cyan}>
            <animate
              attributeName="fill"
              values={`${NEON.cyan};${NEON.lime};${NEON.gold};${NEON.pink};${NEON.violet};${NEON.cyan}`}
              dur="9s"
              repeatCount="indefinite"
            />
          </circle>
          <circle cx={0} cy={0} r={r * 0.42} fill="none" stroke="rgba(0,0,0,.28)" strokeWidth={r * 0.05} />
          <g>
            <animateTransform attributeName="transform" type="rotate" values="0;360" dur="40s" repeatCount="indefinite" />
            {Array.from({ length: 24 }, (_, i) => {
              const a = (i / 24) * Math.PI * 2;
              return (
                <line
                  key={i}
                  x1={svgN(Math.cos(a) * r * 0.18)}
                  y1={svgN(Math.sin(a) * r * 0.18)}
                  x2={svgN(Math.cos(a) * r * 0.4)}
                  y2={svgN(Math.sin(a) * r * 0.4)}
                  stroke="rgba(0,0,0,.18)"
                  strokeWidth={1.2}
                />
              );
            })}
          </g>
          <circle cx={0} cy={0} r={r * 0.17} fill="#08060f">
            <animate attributeName="r" values={`${r * 0.14};${r * 0.2};${r * 0.14}`} dur="5s" repeatCount="indefinite" />
          </circle>
          <circle cx={svgN(-r * 0.13)} cy={svgN(-r * 0.14)} r={r * 0.07} fill="#fff" opacity={0.92} />
        </g>
      </g>
      {chordH.map((h, i) => {
        const w = svgN(Math.sqrt(Math.max(0, r * r - h * h)));
        return (
          <line
            key={`ch${i}`}
            x1={cx - w}
            y1={baseY - h}
            x2={cx + w}
            y2={baseY - h}
            stroke="rgba(255,255,255,.07)"
            strokeWidth={1}
          />
        );
      })}
      {meridDx.map((dx, i) => {
        const hh = svgN(Math.sqrt(Math.max(0, r * r - dx * dx)));
        return (
          <line
            key={`me${i}`}
            x1={cx + dx}
            y1={baseY}
            x2={cx + dx}
            y2={baseY - hh}
            stroke="rgba(255,255,255,.06)"
            strokeWidth={1}
          />
        );
      })}
      <ellipse cx={cx - r * 0.3} cy={baseY - r * 0.72} rx={r * 0.34} ry={r * 0.16} fill="#fff" opacity={0.06}>
        <animateTransform
          attributeName="transform"
          type="translate"
          values={`0 0; ${svgN(r * 0.55)} ${svgN(r * 0.18)}; 0 0`}
          dur="11s"
          repeatCount="indefinite"
          additive="sum"
        />
      </ellipse>
      <path d={`M${cx - r},${baseY} A${r},${r} 0 0 1 ${cx + r},${baseY}`} fill="none" stroke="rgba(255,255,255,.18)" strokeWidth={2} />
      <line x1={cx - r} y1={baseY} x2={cx + r} y2={baseY} stroke="rgba(255,255,255,.12)" strokeWidth={2} />
    </g>
  );
}

export function HighRoller({ cx = 1760, cy = 400, r = 130 }: { cx?: number; cy?: number; r?: number }) {
  const spokes = 24;
  return (
    <g>
      <line x1={cx} y1={cy} x2={cx - 70} y2={GND} stroke="#3a3450" strokeWidth={7} />
      <line x1={cx} y1={cy} x2={cx + 70} y2={GND} stroke="#3a3450" strokeWidth={7} />
      <g>
        <animateTransform
          attributeName="transform"
          type="rotate"
          values={`0 ${cx} ${cy}; 360 ${cx} ${cy}`}
          dur="70s"
          repeatCount="indefinite"
        />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="#4a4468" strokeWidth={3} />
        <circle cx={cx} cy={cy} r={r * 0.5} fill="none" stroke="#3a3450" strokeWidth={2} />
        {Array.from({ length: spokes }, (_, i) => {
          const a = (i / spokes) * Math.PI * 2;
          const px = svgN(cx + Math.cos(a) * r);
          const py = svgN(cy + Math.sin(a) * r);
          const hue = [NEON.pink, NEON.cyan, NEON.gold, NEON.lime, NEON.violet][i % 5];
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={px} y2={py} stroke="rgba(150,180,220,.25)" strokeWidth={1} />
              <circle cx={px} cy={py} r={6} fill={hue} opacity={0.9}>
                <animate
                  attributeName="opacity"
                  values="0.4;1;0.4"
                  dur="2.5s"
                  begin={`${(i % 6) * 0.4}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          );
        })}
      </g>
      <circle cx={cx} cy={cy} r={10} fill="#5a5478" />
    </g>
  );
}

export function WelcomeSign({ x = 1880 }: { x?: number }) {
  return (
    <g>
      <line x1={x} y1={GND} x2={x} y2={520} stroke="#4a4460" strokeWidth={6} />
      <line x1={x + 36} y1={GND} x2={x + 36} y2={540} stroke="#4a4460" strokeWidth={6} />
      <g transform={`translate(${x + 18},500)`}>
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2;
          return (
            <line
              key={i}
              x1={0}
              y1={0}
              x2={svgN(Math.cos(a) * 26)}
              y2={svgN(Math.sin(a) * 26)}
              stroke={NEON.gold}
              strokeWidth={2}
            />
          );
        })}
        <circle cx={0} cy={0} r={12} fill={NEON.gold}>
          <animate attributeName="opacity" values="0.5;1;0.5" dur="1.8s" repeatCount="indefinite" />
        </circle>
      </g>
      <polygon
        points={`${x - 26},520 ${x + 62},520 ${x + 52},612 ${x - 16},612`}
        fill="#f3ead2"
        stroke={NEON.gold}
        strokeWidth={2}
      />
      <text x={x + 18} y={548} textAnchor="middle" fontSize={11} fontWeight={700} fill="#c0392b" fontFamily="Georgia, serif">
        WELCOME
      </text>
      <text x={x + 18} y={566} textAnchor="middle" fontSize={9} fill="#1f3a5f" fontFamily="Georgia, serif">
        to fabulous
      </text>
      <text x={x + 18} y={588} textAnchor="middle" fontSize={12} fontWeight={700} fill="#1f3a5f" fontFamily="Georgia, serif">
        LAS VEGAS
      </text>
      <text x={x + 18} y={602} textAnchor="middle" fontSize={7} fill="#c0392b" fontFamily="Georgia, serif">
        NEVADA
      </text>
    </g>
  );
}
