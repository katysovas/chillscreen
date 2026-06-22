'use client';

import { forwardRef, memo, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GND_F } from '@/lib/parallax';
import {
  cityOptionForRoute,
  cityWorldOffBounds,
  nextCityRoute,
  prevCityRoute,
  staticCitySignGroundX,
} from '@/lib/isolatedCity';
import { ArrowSignBoard } from './city/ArrowSignBoard';
import { PARALLAX_LAYER_BASE } from './city/shared/parallaxLayerStyle';
import { venueSlugForRoute } from '@/lib/venueRoutes';
import type { VenueRoute } from '@/lib/venueRoutes';
import { Z_NAV_SIGNS } from '@/lib/zLayers';
import { CITY_GRASS_DROP_Y } from '@/components/game/city/cinema/constants';
import { FOREST_GRASS_DROP_Y } from '@/components/game/city/forest/constants';
import { TENTAROO_GRASS_DROP_Y } from '@/components/game/city/tentaroo/constants';
import { SEATTLE_GRASS_DROP_Y } from '@/components/game/city/seattle/constants';
import { SF_GRASS_DROP_Y } from '@/components/game/city/sf/constants';
import { VEGAS_GRASS_DROP_Y } from '@/components/game/city/lasvegas/constants';
import { SILENT_DISCO_GRASS_DROP_Y } from '@/components/game/city/silent-disco/constants';

const GND_Y = 685;
const SIGN_Y = GND_Y + 12;

const VIEW_W = 1400;

/** City icon + accent for the sign boards (matches the old junction signs). */
const SIGN_STYLE: Record<VenueRoute, { icon: string; accent: string }> = {
  'outside-hands': { icon: '🌉', accent: '#c24f2c' },
  'seattle-concerts': { icon: '🌲', accent: '#3d6b8a' },
  coachella: { icon: '🎡', accent: '#e85074' },
  edc: { icon: '🎰', accent: '#ff2e9a' },
  tentaroo: { icon: '🎸', accent: '#50b87a' },
  forest: { icon: '🌲', accent: '#2dd4a0' },
  'silent-disco': { icon: '🎧', accent: '#ff3df0' },
  cinema: { icon: '🎬', accent: '#b88c3d' },
  'deep-space': { icon: '🛸', accent: '#36e0c8' },
  'creator-chill': { icon: '🎸', accent: '#50b87a' },
  'creator-cinema': { icon: '🌆', accent: '#50b87a' },
  hula: { icon: '🎃', accent: '#50b87a' },
};

type EdgeSignProps = {
  x: number;
  y: number;
  dir: 'left' | 'right';
  route: VenueRoute;
  onGo: () => void;
  /** Smaller board + post for static viewport stages. */
  compact?: boolean;
};

const EDGE_SIGN_FULL = {
  postW: 10,
  postH: 124,
  boardPad: 34,
  halfLen: 104,
  halfH: 30,
  tipLen: 26,
  fontSize: 13,
  pulseR: 60,
  shadowRx: 88,
  shadowRy: 8,
} as const;

const EDGE_SIGN_COMPACT = {
  postW: 8,
  postH: 96,
  boardPad: 26,
  halfLen: 80,
  halfH: 23,
  tipLen: 20,
  fontSize: 10,
  pulseR: 44,
  shadowRx: 66,
  shadowRy: 6,
} as const;

/** Shared sign motion — CSS transform/opacity only (compositor-friendly, no SMIL). */
const EDGE_SIGN_MOTION_CSS = `
  @keyframes edge-sign-bob {
    0%, 100% { transform: translate3d(0, 0, 0); }
    50% { transform: translate3d(0, -7px, 0); }
  }
  @keyframes edge-sign-pulse {
    0% { transform: scale(1); opacity: 0.55; }
    100% { transform: scale(1.78); opacity: 0; }
  }
  .edge-sign-board {
    transform-box: fill-box;
    transform-origin: center;
    animation: edge-sign-bob 2.4s ease-in-out infinite;
  }
  .edge-sign-pulse {
    transform-box: fill-box;
    transform-origin: center;
    animation: edge-sign-pulse 2.4s ease-out infinite;
  }
  .edge-sign-pulse--delay {
    animation-delay: 1.2s;
  }
`;

/** Wooden signpost with one chevron wing — same art as the old junction signs. */
function EdgeSign({ x, y, dir, route, onGo, compact = false }: EdgeSignProps) {
  const { title } = cityOptionForRoute(route);
  const { icon, accent } = SIGN_STYLE[route];
  const label = `Enter ${title}`;

  const m = compact ? EDGE_SIGN_COMPACT : EDGE_SIGN_FULL;
  const postW = m.postW;
  const postH = m.postH;
  const boardCy = -postH + m.boardPad;

  return (
    <g transform={`translate(${x},${y})`}>
      <ellipse
        cx={0}
        cy={3}
        rx={m.shadowRx}
        ry={m.shadowRy}
        fill="rgba(0,0,0,.22)"
        pointerEvents="none"
      />

      {/* Accent pulse — CSS only (replaces per-circle SMIL r/opacity) */}
      <g transform={`translate(0,${boardCy})`} pointerEvents="none">
        <circle
          className="edge-sign-pulse"
          cx={0}
          cy={0}
          r={m.pulseR}
          fill="none"
          stroke={accent}
          strokeWidth={3}
        />
        <circle
          className="edge-sign-pulse edge-sign-pulse--delay"
          cx={0}
          cy={0}
          r={m.pulseR}
          fill="none"
          stroke={accent}
          strokeWidth={3}
        />
      </g>

      <g
        style={{ pointerEvents: 'auto', cursor: 'pointer' }}
        onClick={onGo}
        role="link"
        aria-label={label}
      >
        <rect x={-postW / 2} y={-postH} width={postW} height={postH} rx={2} fill="#5c4636" />
        <rect x={-postW / 2 + 1} y={-postH} width={postW - 2} height={postH - 2} rx={1.5} fill="#8a6b4f" />
        <line x1={0} y1={-postH + 6} x2={0} y2={-4} stroke="#6b5344" strokeWidth={1} opacity={0.45} />
        <circle cx={0} cy={-postH + 2} r={2.5} fill="#6b5344" stroke="#3a342c" strokeWidth={0.8} />

        {/* Bobbing board — same motion language as in-game pickups */}
        <g className="edge-sign-board">
          <ArrowSignBoard
            cy={boardCy}
            dir={dir}
            label={label}
            icon={icon}
            accent={accent}
            halfLen={m.halfLen}
            halfH={m.halfH}
            tipLen={m.tipLen}
            fontSize={m.fontSize}
          />
        </g>
      </g>
    </g>
  );
}

type Props = {
  route: VenueRoute;
  worldOff: number;
  active: boolean;
};

/**
 * Ground-layer SVG with prev/next city signposts planted just past the walk
 * bounds — the player walks right up to them and clicks to travel. The SVG ref
 * is wired into SFCity's updateViewBoxes for smooth per-frame scrolling.
 */
export const CityNavSigns = memo(forwardRef<SVGSVGElement, Props>(
  function CityNavSigns({ route, worldOff, active }, ref) {
    const router = useRouter();
    const [viewport, setViewport] = useState(() => ({
      w: typeof window !== 'undefined' ? window.innerWidth : VIEW_W,
      h: typeof window !== 'undefined' ? window.innerHeight : 900,
    }));

    useEffect(() => {
      const onResize = () => {
        setViewport({ w: window.innerWidth, h: window.innerHeight });
      };
      onResize();
      window.addEventListener('resize', onResize);
      return () => window.removeEventListener('resize', onResize);
    }, []);

    const bounds = cityWorldOffBounds(route);
    const prev = prevCityRoute(route);
    const next = nextCityRoute(route);
    const cameraOff = bounds.min;
    const edgeSigns = staticCitySignGroundX(cameraOff, viewport.w, viewport.h);
    const leftX = edgeSigns.leftX;
    const rightX = edgeSigns.rightX;
    const grassDropY = route === 'silent-disco'
      ? SILENT_DISCO_GRASS_DROP_Y
      : route === 'forest'
        ? FOREST_GRASS_DROP_Y
        : route === 'tentaroo'
          ? TENTAROO_GRASS_DROP_Y
          : route === 'seattle-concerts'
            ? SEATTLE_GRASS_DROP_Y
            : route === 'outside-hands' || route === 'cinema'
              ? SF_GRASS_DROP_Y
              : route === 'edc'
                ? VEGAS_GRASS_DROP_Y
                : CITY_GRASS_DROP_Y;
    const signY = SIGN_Y + grassDropY;

    const showNavSigns = route !== 'deep-space';

    const goTo = (target: VenueRoute) => {
      router.push(`/${venueSlugForRoute(target)}`);
    };

    return (
      <svg
        ref={ref}
        data-paraloid-svg
        data-paraloid-layer="ground"
        viewBox={`${worldOff * GND_F} 0 1400 900`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{
          ...PARALLAX_LAYER_BASE,
          zIndex: Z_NAV_SIGNS,
          pointerEvents: 'none',
          opacity: active ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        <style>{EDGE_SIGN_MOTION_CSS}</style>
        {active && showNavSigns && (
          <>
            <EdgeSign x={leftX} y={signY} dir="left" route={prev} onGo={() => goTo(prev)} compact />
            <EdgeSign x={rightX} y={signY} dir="right" route={next} onGo={() => goTo(next)} compact />
          </>
        )}
      </svg>
    );
  },
));
