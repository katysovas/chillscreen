import { GND_F, GND_TILE } from '@/lib/parallax';
import { GROUND_TREE_XS } from '@/lib/sleepingCats';
import { SleepingCatsGround } from '../SleepingCat';
import { ParallaxSvgLayer } from './shared/ParallaxSvgLayer';
import { StreetTree } from './street/StreetTree';
import { LampPost } from './street/LampPost';

const GND_Y = 685;
const LAMP_XS = [380, 700, 1060, 1400, 1740, 2080, 2420, 2760, 3100];
const HYDRANTS = [560, 1850, 3050];
const BENCHES = [920, 2180, 3380];
const BUS_STOPS = [880, 2200];

type GroundLayerProps = {
  worldOff: number;
};

export function GroundLayer({ worldOff }: GroundLayerProps) {
  const vx = worldOff * GND_F;

  return (
    <ParallaxSvgLayer viewBoxX={vx} tileWidth={GND_TILE}>
      {t => (
        <>
          <rect x={0} y={GND_Y + 25} width={GND_TILE} height={215} fill="#b0a878" />
          <rect x={0} y={GND_Y + 25} width={GND_TILE} height={12} fill="rgba(0,0,0,.08)" />
          {Array.from({ length: Math.ceil(GND_TILE / 80) }, (_, i) => (
            <rect
              key={i}
              x={i * 80}
              y={GND_Y + 90}
              width={50}
              height={5}
              rx={2}
              fill="rgba(220,210,160,.45)"
            />
          ))}
          <rect x={0} y={GND_Y - 5} width={GND_TILE} height={30} fill="#c8b882" />
          <rect x={0} y={GND_Y + 22} width={GND_TILE} height={6} fill="#a89870" />
          {Array.from({ length: Math.ceil(GND_TILE / 62) }, (_, i) => (
            <line
              key={i}
              x1={i * 62}
              y1={GND_Y - 5}
              x2={i * 62}
              y2={GND_Y + 22}
              stroke="rgba(0,0,0,.07)"
              strokeWidth={2}
            />
          ))}
          <line x1={0} y1={GND_Y + 8} x2={GND_TILE} y2={GND_Y + 8} stroke="rgba(0,0,0,.05)" strokeWidth={1.5} />
          <line x1={0} y1={GND_Y + 55} x2={GND_TILE} y2={GND_Y + 55} stroke="#706850" strokeWidth={4} />
          <line x1={0} y1={GND_Y + 68} x2={GND_TILE} y2={GND_Y + 68} stroke="#706850" strokeWidth={4} />
          {Array.from({ length: Math.ceil(GND_TILE / 40) }, (_, i) => (
            <rect
              key={i}
              x={i * 40}
              y={GND_Y + 52}
              width={6}
              height={19}
              fill="#605840"
              opacity={0.6}
            />
          ))}
          {GROUND_TREE_XS.map((x, i) => (
            <ellipse key={`sh${i}`} cx={x + 28} cy={GND_Y + 8} rx={50} ry={11} fill="rgba(20,50,0,.2)" />
          ))}
          {GROUND_TREE_XS.map((x, i) => (
            <g
              key={i}
              style={{
                animation: `sw${1 + (i % 3)} ${5 + i * 0.4}s ease-in-out infinite`,
                transformOrigin: `${x}px ${GND_Y}px`,
                animationDelay: `${i * 0.45}s`,
              }}
            >
              <StreetTree x={x} y={GND_Y} h={195 + (i % 4) * 12} sp={88 + (i % 3) * 8} />
            </g>
          ))}
          <SleepingCatsGround tile={t} gndY={GND_Y} />
          {LAMP_XS.map((x, i) => (
            <LampPost key={i} x={x} y={GND_Y} />
          ))}
          {HYDRANTS.map((x, i) => (
            <g key={`h${i}`} transform={`translate(${x},${GND_Y})`}>
              <ellipse cx={8} cy={6} rx={10} ry={4} fill="rgba(20,40,80,.18)" />
              <rect x={2} y={-30} width={12} height={30} rx={3} fill="#c83028" />
              <rect x={0} y={-32} width={16} height={6} rx={2} fill="#e03830" />
              <rect x={4} y={-38} width={8} height={8} rx={1} fill="#c02820" />
              <rect x={-2} y={-20} width={6} height={5} rx={1} fill="#b82820" />
              <rect x={12} y={-20} width={6} height={5} rx={1} fill="#b82820" />
            </g>
          ))}
          {BENCHES.map((x, i) => (
            <g key={`b${i}`} transform={`translate(${x},${GND_Y})`}>
              <ellipse cx={32} cy={6} rx={38} ry={7} fill="rgba(20,40,80,.16)" />
              <rect x={4} y={-28} width={5} height={28} rx={2} fill="#6a5038" />
              <rect x={54} y={-28} width={5} height={28} rx={2} fill="#6a5038" />
              <rect x={0} y={-30} width={63} height={6} rx={2} fill="#8a6840" />
              <rect x={0} y={-26} width={63} height={5} rx={2} fill="#9a7848" />
              <rect x={2} y={-50} width={59} height={5} rx={2} fill="#8a6840" />
              <rect x={8} y={-50} width={5} height={22} rx={2} fill="#6a5038" />
              <rect x={50} y={-50} width={5} height={22} rx={2} fill="#6a5038" />
            </g>
          ))}
          {BUS_STOPS.map((x, i) => (
            <g key={`bs${i}`} transform={`translate(${x},${GND_Y})`}>
              <rect x={-2} y={-105} width={4} height={105} fill="#5a5848" />
              <rect x={-28} y={-108} width={56} height={14} rx={2} fill="#2040a0" />
              <rect x={-18} y={-104} width={36} height={2} fill="rgba(255,255,255,.8)" rx={1} />
              <rect x={-18} y={-100} width={28} height={2} fill="rgba(255,255,255,.6)" rx={1} />
            </g>
          ))}
        </>
      )}
    </ParallaxSvgLayer>
  );
}
