import { forwardRef, memo } from 'react';
import {
  CITY_GND_W,
  GND_F,
  gndOriginForTile,
  nearGndTiles,
} from '@/lib/parallax';
import { gndWidthForTile } from '@/lib/worldTileGeometry';
import { nearIsolatedGndTiles } from '@/lib/isolatedCity';
import type { VenueRoute } from '@/lib/venueRoutes';
import { isStaticCityTemplateRoute } from '@/lib/venueSlugs';
import { VIEW_WIDTH } from '@/lib/venues';
import {
  MOBILE_VENUE_GROUND_PAR,
  staticMobileGroundViewBox,
} from '@/lib/staticCityViewport';
import { CITY_GRASS_DROP_Y } from './cinema/constants';
import { FOREST_GRASS_DROP_Y } from './forest/constants';
import { SEATTLE_GRASS_DROP_Y } from './seattle/constants';
import { SF_GRASS_DROP_Y } from './sf/constants';
import { VEGAS_GRASS_DROP_Y } from './lasvegas/constants';
import { TENTAROO_GRASS_DROP_Y } from './tentaroo/constants';
import { CHILL_GRASS_DROP_Y, LANDING_GRASS_FILL } from './chill/constants';
import { SILENT_DISCO_GRASS_DROP_Y } from './silent-disco/constants';
import { GROUND_TREE_XS } from '@/lib/sleepingCats';
import { skipGroundStreetLamp, skipGroundStreetProp, skipGroundStreetTree, type GroundStreetSkipContext } from '@/lib/stageTreeExclusion';
import { SleepingCatsGround } from '../SleepingCat';
import { StreetDogsGround } from '../StreetDog';
import { ParallaxSvgLayer } from './shared/ParallaxSvgLayer';
import { DECORATIVE_SHAPE, PARALLAX_LAYER_BASE } from './shared/parallaxLayerStyle';
import { StreetTree } from './street/StreetTree';
import { LampPost } from './street/LampPost';

const GND_Y = 685;
const GRASS_TOP = GND_Y - 8;
const LAMP_XS = [380, 700, 1060, 1400, 1740, 2080, 2420, 2760, 3100];
const HYDRANTS = [560, 1850, 3050];
const BENCHES = [920, 2180, 3380];
const BUS_STOPS = [880, 2200];

function grassDropYForRoute(route: VenueRoute): number {
  switch (route) {
    case 'silent-disco':
      return SILENT_DISCO_GRASS_DROP_Y;
    case 'forest':
      return FOREST_GRASS_DROP_Y;
    case 'tentaroo':
    case 'creator-chill':
    case 'hula':
    case 'headliner':
      return CHILL_GRASS_DROP_Y;
    case 'seattle-concerts':
      return SEATTLE_GRASS_DROP_Y;
    case 'outside-hands':
    case 'cinema':
      return SF_GRASS_DROP_Y;
    case 'edc':
      return VEGAS_GRASS_DROP_Y;
    default:
      return CITY_GRASS_DROP_Y;
  }
}

/** Deterministic 0..1 for grass scatter (stable per index). */
function grassRand(i: number, salt: number) {
  return ((i * 2654435761 ^ salt * 2246822519) >>> 0) / 4294967296;
}

/** City template experiment — lawn instead of road/sidewalk. */
export function GrassGround({
  w,
  tile,
  dropY,
  skipTopSeam = false,
  overlapTop = 0,
  topOverride,
}: {
  w: number;
  tile: number;
  dropY: number;
  /** Mobile crop — omit the bright top seam that reads as a horizontal divider. */
  skipTopSeam?: boolean;
  /** Pull grass plane upward (landing hero — bridge stage deck / Safari seams). */
  overlapTop?: number;
  /** Fixed grass horizon (landing hero shorter strip). */
  topOverride?: number;
}) {
  const top = topOverride ?? GRASS_TOP + dropY - overlapTop;
  const h = 900 - top;
  const gid = `city-grass-${tile}`;
  const landingGrass = topOverride != null && skipTopSeam;

  const tuftSpacing = skipTopSeam ? 22 : 28;
  const tufts = Array.from({ length: Math.ceil(w / tuftSpacing) }, (_, i) => {
    const r0 = grassRand(i + tile * 97, 1);
    const r1 = grassRand(i + tile * 97, 2);
    const r2 = grassRand(i + tile * 97, 3);
    const cx = i * tuftSpacing + r0 * 14;
    const cy = top + (skipTopSeam ? 12 : 36) + r1 * (h - (skipTopSeam ? 24 : 48));
    const rx = 10 + r2 * 14;
    const ry = 4 + grassRand(i + tile * 97, 4) * 5;
    const fill = r2 > 0.66 ? '#3d6b35' : r2 > 0.33 ? '#4a853f' : '#6aad5c';
    return (
      <ellipse
        key={i}
        cx={cx}
        cy={cy}
        rx={rx}
        ry={ry}
        fill={fill}
        opacity={0.14 + r0 * 0.18}
      />
    );
  });

  return (
    <>
      <defs>
        <linearGradient id={`${gid}-fill`} gradientUnits="userSpaceOnUse" x1={0} y1={top} x2={0} y2={top + h}>
          <stop offset="0%" stopColor={skipTopSeam ? '#5a9c4e' : '#6eb860'} />
          <stop offset="45%" stopColor="#5a9c4e" />
          <stop offset="100%" stopColor="#3f7238" />
        </linearGradient>
        <linearGradient id={`${gid}-depth`} gradientUnits="userSpaceOnUse" x1={0} y1={top + h * 0.5} x2={0} y2={top + h}>
          <stop offset="0%" stopColor="#1a3018" stopOpacity={0} />
          <stop offset="100%" stopColor="#1a3018" stopOpacity={0.22} />
        </linearGradient>
        <linearGradient id={`${gid}-seam`} gradientUnits="userSpaceOnUse" x1={0} y1={top} x2={0} y2={top + 24}>
          <stop offset="0%" stopColor="#8ecf7e" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#8ecf7e" stopOpacity={0} />
        </linearGradient>
      </defs>
      {landingGrass && (
        <rect x={0} y={top} width={w + 2} height={h + 1} fill={LANDING_GRASS_FILL} />
      )}
      <rect x={0} y={top} width={w + 2} height={h + 1} fill={`url(#${gid}-fill)`} />
      {!landingGrass && Array.from({ length: Math.ceil(h / 52) }, (_, i) => (
        <rect
          key={`stripe-${i}`}
          x={0}
          y={top + i * 52}
          width={w + 2}
          height={26}
          fill={i % 2 === 0 ? '#ffffff' : '#1a3018'}
          opacity={0.035}
        />
      ))}
      <g opacity={landingGrass ? 0.55 : 0.9}>{tufts}</g>
      {!landingGrass && (
        <rect x={0} y={top} width={w + 2} height={h + 1} fill={`url(#${gid}-depth)`} />
      )}
      {!skipTopSeam && (
        <rect x={0} y={top} width={w + 1} height={24} fill={`url(#${gid}-seam)`} />
      )}
    </>
  );
}

function StreetGround({ w }: { w: number }) {
  return (
    <>
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
    </>
  );
}

type GroundLayerProps = {
  worldOff: number;
  hideTrees?: boolean;
  /** Skip animated sidewalk dogs (e.g. Silent Disco). */
  hideStreetDogs?: boolean;
  /** Lunar surface only — no street, trees, cats, or props (Chill Cinema / The Orbit). */
  bareGround?: boolean;
  /** When set, only this city tile is rendered (isolated city mode). */
  isolatedTileIndex?: number;
  deepLinkRoute?: VenueRoute;
  /** Landing page hero — viewport-aligned grass (no tile seams). */
  landingHero?: boolean;
  /** Mobile lawn — flat continuous grass without stripe/seam artifacts. */
  mobileLawn?: boolean;
};

function groundTileContent(
  tile: number,
  hideTrees = false,
  hideStreetDogs = false,
  bareGround = false,
  skipCtx?: GroundStreetSkipContext,
  mobileLawn = false,
) {
  // Draw the road/sidewalk at the tile's natural width and show only the props
  // that fit. Short town tiles previously squeezed everything with a non-uniform
  // scale(scale,1), distorting trees, hydrants, benches and cats — never scale
  // discrete art; just render fewer pieces in narrow tiles.
  const w = gndWidthForTile(tile);
  const grassGround = skipCtx?.route != null && isStaticCityTemplateRoute(skipCtx.route);
  const grassDropY = skipCtx?.route != null ? grassDropYForRoute(skipCtx.route) : CITY_GRASS_DROP_Y;
  const gndY = grassGround ? GND_Y + grassDropY : GND_Y;
  // Keep a prop fully inside the tile (account for its art half-width).
  const fits = (x: number, halfW: number) => x <= w - halfW;

  if (bareGround) {
    // Deep Space — transparent deck so parallax stars show through.
    return null;
  }

  return (
    <g {...DECORATIVE_SHAPE}>
      {grassGround ? (
        <GrassGround w={w} tile={tile} dropY={grassDropY} skipTopSeam={mobileLawn} />
      ) : (
        <StreetGround w={w} />
      )}
      {!hideTrees && GROUND_TREE_XS.map((x, i) => (
        fits(x, 90) && !skipGroundStreetTree(tile, x, w, skipCtx) ? (
          <ellipse key={`sh${i}`} cx={x + 28} cy={gndY + 8} rx={50} ry={11} fill="rgba(20,50,0,.2)" />
        ) : null
      ))}
      {!hideTrees && GROUND_TREE_XS.map((x, i) => (
        fits(x, 90) && !skipGroundStreetTree(tile, x, w, skipCtx) ? (
          <g
            key={i}
            style={{
              animation: `sw${1 + (i % 3)} ${5 + i * 0.4}s ease-in-out infinite`,
              transformOrigin: `${x}px ${gndY}px`,
              animationDelay: `${i * 0.45}s`,
            }}
          >
            <StreetTree x={x} y={gndY} h={195 + (i % 4) * 12} sp={88 + (i % 3) * 8} />
          </g>
        ) : null
      ))}
      <SleepingCatsGround tile={tile} gndY={gndY} maxX={w - 60} />
      {!hideStreetDogs && (
        <StreetDogsGround tile={tile} gndY={gndY} maxX={w - 60} />
      )}
      {!grassGround && (
        <>
      {LAMP_XS.map((x, i) => (
        fits(x, 30) && !skipGroundStreetLamp(tile, x, w, skipCtx) ? <LampPost key={i} x={x} y={GND_Y} /> : null
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
        </>
      )}
    </g>
  );
}

export const GroundLayer = memo(forwardRef<SVGSVGElement, GroundLayerProps>(
  function GroundLayer({ worldOff, hideTrees = false, hideStreetDogs = false, bareGround = false, isolatedTileIndex, deepLinkRoute, landingHero = false, mobileLawn = false }, ref) {
    const vx = worldOff * GND_F;
    const skipCtx: GroundStreetSkipContext | undefined = deepLinkRoute
      ? { route: deepLinkRoute, cameraOff: worldOff }
      : undefined;

    const nearTiles = isolatedTileIndex != null
      ? nearIsolatedGndTiles(isolatedTileIndex, deepLinkRoute)
      : nearGndTiles;

    return (
        <ParallaxSvgLayer
          ref={ref}
          viewBoxX={vx}
          viewBox={mobileLawn && deepLinkRoute ? staticMobileGroundViewBox(vx, deepLinkRoute) : undefined}
          preserveAspectRatio={mobileLawn ? MOBILE_VENUE_GROUND_PAR : 'xMidYMid slice'}
          tileWidth={CITY_GND_W}
          tileOrigin={gndOriginForTile}
          nearTileIndices={nearTiles}
          shapeRendering="optimizeSpeed"
          parallaxLayer="ground"
          style={{ zIndex: 5, pointerEvents: 'none' }}
        children={tile => groundTileContent(tile, hideTrees, hideStreetDogs, bareGround, skipCtx, mobileLawn)}
      />
    );
  },
));
