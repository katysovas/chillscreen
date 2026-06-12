import { forwardRef, memo } from 'react';
import {
  CITY_GND_W,
  GND_F,
  gndOriginForTile,
  gndWidthForTile,
  nearGndTiles,
} from '@/lib/parallax';
import { nearIsolatedGndTiles } from '@/lib/isolatedCity';
import { GROUND_TREE_XS } from '@/lib/sleepingCats';
import { skipGroundStreetProp, skipGroundStreetTree } from '@/lib/stageTreeExclusion';
import { SleepingCatsGround } from '../SleepingCat';
import { StreetDogsGround } from '../StreetDog';
import { ParallaxSvgLayer } from './shared/ParallaxSvgLayer';
import { DECORATIVE_SHAPE } from './shared/parallaxLayerStyle';
import { StreetTree } from './street/StreetTree';
import { LampPost } from './street/LampPost';

const GND_Y = 685;
const LAMP_XS = [380, 700, 1060, 1400, 1740, 2080, 2420, 2760, 3100];
const HYDRANTS = [560, 1850, 3050];
const BENCHES = [920, 2180, 3380];
const BUS_STOPS = [880, 2200];

type GroundLayerProps = {
  worldOff: number;
  hideTrees?: boolean;
  /** Skip animated sidewalk dogs (e.g. Silent Disco). */
  hideStreetDogs?: boolean;
  /** Lunar surface only — no street, trees, cats, or props (Chill Cinema / The Orbit). */
  bareGround?: boolean;
  /** When set, only this city tile is rendered (isolated city mode). */
  isolatedTileIndex?: number;
};

function groundTileContent(tile: number, hideTrees = false, hideStreetDogs = false, bareGround = false) {
  // Draw the road/sidewalk at the tile's natural width and show only the props
  // that fit. Short town tiles previously squeezed everything with a non-uniform
  // scale(scale,1), distorting trees, hydrants, benches and cats — never scale
  // discrete art; just render fewer pieces in narrow tiles.
  const w = gndWidthForTile(tile);
  // Keep a prop fully inside the tile (account for its art half-width).
  const fits = (x: number, halfW: number) => x <= w - halfW;

  if (bareGround) {
    // Deep Space — transparent deck so parallax stars show through.
    return null;
  }

  return (
    <g {...DECORATIVE_SHAPE}>
      <rect x={0} y={GND_Y + 25} width={w} height={215} fill="#b0a878" />
      <rect x={0} y={GND_Y + 25} width={w} height={12} fill="rgba(0,0,0,.08)" />
      {Array.from({ length: Math.ceil(w / 80) }, (_, i) => (
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
      <rect x={0} y={GND_Y - 5} width={w} height={30} fill="#c8b882" />
      <rect x={0} y={GND_Y + 22} width={w} height={6} fill="#a89870" />
      {Array.from({ length: Math.ceil(w / 62) }, (_, i) => (
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
      <line x1={0} y1={GND_Y + 8} x2={w} y2={GND_Y + 8} stroke="rgba(0,0,0,.05)" strokeWidth={1.5} />
      <line x1={0} y1={GND_Y + 55} x2={w} y2={GND_Y + 55} stroke="#706850" strokeWidth={4} />
      <line x1={0} y1={GND_Y + 68} x2={w} y2={GND_Y + 68} stroke="#706850" strokeWidth={4} />
      {Array.from({ length: Math.ceil(w / 40) }, (_, i) => (
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
      {!hideTrees && GROUND_TREE_XS.map((x, i) => (
        fits(x, 90) && !skipGroundStreetTree(tile, x, w) ? (
          <ellipse key={`sh${i}`} cx={x + 28} cy={GND_Y + 8} rx={50} ry={11} fill="rgba(20,50,0,.2)" />
        ) : null
      ))}
      {!hideTrees && GROUND_TREE_XS.map((x, i) => (
        fits(x, 90) && !skipGroundStreetTree(tile, x, w) ? (
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
        ) : null
      ))}
      <SleepingCatsGround tile={tile} gndY={GND_Y} maxX={w - 60} />
      {!hideStreetDogs && (
        <StreetDogsGround tile={tile} gndY={GND_Y} maxX={w - 60} />
      )}
      {LAMP_XS.map((x, i) => (
        fits(x, 30) && !skipGroundStreetProp(tile, x, w) ? <LampPost key={i} x={x} y={GND_Y} /> : null
      ))}
      {HYDRANTS.map((x, i) => (
        fits(x, 24) && !skipGroundStreetProp(tile, x, w) ? (
        <g key={`h${i}`} transform={`translate(${x},${GND_Y})`}>
          <ellipse cx={8} cy={6} rx={10} ry={4} fill="rgba(20,40,80,.18)" />
          <rect x={2} y={-30} width={12} height={30} rx={3} fill="#c83028" />
          <rect x={0} y={-32} width={16} height={6} rx={2} fill="#e03830" />
          <rect x={4} y={-38} width={8} height={8} rx={1} fill="#c02820" />
          <rect x={-2} y={-20} width={6} height={5} rx={1} fill="#b82820" />
          <rect x={12} y={-20} width={6} height={5} rx={1} fill="#b82820" />
        </g>
        ) : null
      ))}
      {BENCHES.map((x, i) => (
        fits(x, 70) && !skipGroundStreetProp(tile, x, w) ? (
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
        ) : null
      ))}
      {BUS_STOPS.map((x, i) => (
        fits(x, 40) ? (
        <g key={`bs${i}`} transform={`translate(${x},${GND_Y})`}>
          <rect x={-2} y={-105} width={4} height={105} fill="#5a5848" />
          <rect x={-28} y={-108} width={56} height={14} rx={2} fill="#2040a0" />
          <rect x={-18} y={-104} width={36} height={2} fill="rgba(255,255,255,.8)" rx={1} />
          <rect x={-18} y={-100} width={28} height={2} fill="rgba(255,255,255,.6)" rx={1} />
        </g>
        ) : null
      ))}
    </g>
  );
}

export const GroundLayer = memo(forwardRef<SVGSVGElement, GroundLayerProps>(
  function GroundLayer({ worldOff, hideTrees = false, hideStreetDogs = false, bareGround = false, isolatedTileIndex }, ref) {
    const vx = worldOff * GND_F;
    const nearTiles = isolatedTileIndex != null
      ? nearIsolatedGndTiles(isolatedTileIndex)
      : nearGndTiles;

    return (
      <ParallaxSvgLayer
        ref={ref}
        viewBoxX={vx}
        tileWidth={CITY_GND_W}
        tileOrigin={gndOriginForTile}
        nearTileIndices={nearTiles}
        shapeRendering="optimizeSpeed"
        style={{ zIndex: 5, pointerEvents: 'none' }}
        children={tile => groundTileContent(tile, hideTrees, hideStreetDogs, bareGround)}
      />
    );
  },
));
