'use client';

import { forwardRef, memo } from 'react';
import { useRouter } from 'next/navigation';
import { GND_F } from '@/lib/parallax';
import {
  cityOptionForRoute,
  cityWorldOffBounds,
  nextCityRoute,
  prevCityRoute,
} from '@/lib/isolatedCity';
import { ArrowSignBoard } from './city/ArrowSignBoard';
import { PARALLAX_LAYER_BASE } from './city/shared/parallaxLayerStyle';
import { venueSlugForRoute } from '@/lib/venueRoutes';
import type { VenueRoute } from '@/lib/venueRoutes';

const GND_Y = 685;
const SIGN_Y = GND_Y + 12;

const VIEW_W = 1400;

/**
 * Distance from the viewport edge when the camera rests at a walk bound.
 * worldOff is the viewport's LEFT edge in ground px (GND_F = 1), so at
 * bounds.min the screen shows [min, min+VIEW_W] — the left sign must sit
 * inside that range, and the right sign near max+VIEW_W.
 */
/** Inset from viewport edge at walk bounds — wing + pulse need ~130px clearance. */
const SIGN_EDGE_INSET_PX = 260;

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
  'creator-live': { icon: '🌌', accent: '#c064ff' },
  'creator-cinema': { icon: '🎬', accent: '#50b87a' },
};

type EdgeSignProps = {
  x: number;
  dir: 'left' | 'right';
  route: VenueRoute;
  onGo: () => void;
};

/** Wooden signpost with one chevron wing — same art as the old junction signs. */
function EdgeSign({ x, dir, route, onGo }: EdgeSignProps) {
  const { title } = cityOptionForRoute(route);
  const { icon, accent } = SIGN_STYLE[route];
  const label = `Enter ${title}`;

  const postW = 10;
  const postH = 124;
  const boardCy = -postH + 34;

  return (
    <g
      transform={`translate(${x},${SIGN_Y})`}
      style={{ pointerEvents: 'auto', cursor: 'pointer' }}
      onClick={onGo}
      role="link"
      aria-label={label}
    >
      {/* Generous invisible hit area */}
      <rect
        x={-130}
        y={-postH - 50}
        width={260}
        height={postH + 66}
        fill="#fff"
        fillOpacity={0}
        pointerEvents="all"
      />

      <ellipse cx={0} cy={3} rx={88} ry={8} fill="rgba(0,0,0,.22)" />

      {/* Post */}
      <rect x={-postW / 2} y={-postH} width={postW} height={postH} rx={2} fill="#5c4636" />
      <rect x={-postW / 2 + 1} y={-postH} width={postW - 2} height={postH - 2} rx={1.5} fill="#8a6b4f" />
      <line x1={0} y1={-postH + 6} x2={0} y2={-4} stroke="#6b5344" strokeWidth={1} opacity={0.45} />
      <circle cx={0} cy={-postH + 2} r={3} fill="#6b5344" stroke="#3a342c" strokeWidth={0.8} />

      {/* Expanding pulse rings — clearly clickable */}
      <g style={{ pointerEvents: 'none' }}>
        <circle cx={0} cy={boardCy} fill="none" stroke={accent} strokeWidth={4}>
          <animate attributeName="r" values="60;108" dur="1.8s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.85;0" dur="1.8s" repeatCount="indefinite" />
        </circle>
        <circle cx={0} cy={boardCy} fill="none" stroke={accent} strokeWidth={4}>
          <animate attributeName="r" values="60;108" dur="1.8s" begin="0.9s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.85;0" dur="1.8s" begin="0.9s" repeatCount="indefinite" />
        </circle>
      </g>

      {/* Bobbing board — same motion language as in-game pickups */}
      <g className="edge-sign-board">
        <ArrowSignBoard
          cy={boardCy}
          dir={dir}
          label={label}
          icon={icon}
          accent={accent}
          halfLen={104}
          halfH={30}
          tipLen={26}
          fontSize={13}
        />
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

    const bounds = cityWorldOffBounds(route);
    const prev = prevCityRoute(route);
    const next = nextCityRoute(route);
    const leftX = bounds.min + SIGN_EDGE_INSET_PX;
    const rightX = bounds.max + VIEW_W - SIGN_EDGE_INSET_PX;

    const goTo = (target: VenueRoute) => {
      router.push(`/${venueSlugForRoute(target)}`);
    };

    return (
      <svg
        ref={ref}
        data-paraloid-svg
        viewBox={`${worldOff * GND_F} 0 1400 900`}
        width="100%"
        height="100%"
        preserveAspectRatio="xMidYMid slice"
        style={{
          ...PARALLAX_LAYER_BASE,
          zIndex: 25,
          pointerEvents: 'none',
          opacity: active ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      >
        <style>{`
          @keyframes edge-sign-bob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-7px); }
          }
          .edge-sign-board {
            animation: edge-sign-bob 1.6s ease-in-out infinite;
          }
        `}</style>
        {active && (
          <>
            <EdgeSign x={leftX} dir="left" route={prev} onGo={() => goTo(prev)} />
            <EdgeSign x={rightX} dir="right" route={next} onGo={() => goTo(next)} />
          </>
        )}
      </svg>
    );
  },
));
