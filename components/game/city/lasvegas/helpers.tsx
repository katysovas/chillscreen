import type { ReactElement } from 'react';
import { NEON } from './constants';

/** Stable decimal precision for SVG attrs — avoids SSR/client float drift. */
export function svgN(n: number): number {
  return Math.round(n * 1e4) / 1e4;
}

/** A grid of lit windows on a tower face. */
export function litWindows(
  x: number,
  y: number,
  w: number,
  h: number,
  cols: number,
  rows: number,
  color: string,
  seed = 1,
) {
  const cells: ReactElement[] = [];
  const cw = w / cols;
  const ch = h / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const on = ((c * 7 + r * 13 + seed * 5) % 5) > 1;
      cells.push(
        <rect
          key={`${r}-${c}`}
          x={x + c * cw + cw * 0.22}
          y={y + r * ch + ch * 0.22}
          width={cw * 0.56}
          height={ch * 0.56}
          fill={on ? color : 'rgba(120,140,170,.10)'}
          opacity={on ? 0.85 : 1}
        />,
      );
    }
  }
  return <g>{cells}</g>;
}

/** A fan of laser beams sweeping from a point. */
export function laserFan(
  ox: number,
  oy: number,
  count: number,
  length: number,
  color: string,
  spread: number,
) {
  const beams: ReactElement[] = [];
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0.5 : i / (count - 1);
    const ang = (-spread / 2 + spread * t) * (Math.PI / 180);
    const ex = svgN(ox + Math.sin(ang) * length);
    const ey = svgN(oy - Math.cos(ang) * length);
    beams.push(
      <line
        key={i}
        x1={ox}
        y1={oy}
        x2={ex}
        y2={ey}
        stroke={color}
        strokeWidth={1.6}
        opacity={0.5}
      >
        <animate
          attributeName="opacity"
          values="0.08;0.6;0.08"
          dur={`${2.2 + (i % 3) * 0.6}s`}
          begin={`${i * 0.18}s`}
          repeatCount="indefinite"
        />
      </line>,
    );
  }
  return (
    <g>
      <animateTransform
        attributeName="transform"
        type="rotate"
        values={`-7 ${ox} ${oy}; 7 ${ox} ${oy}; -7 ${ox} ${oy}`}
        dur="9s"
        repeatCount="indefinite"
      />
      {beams}
    </g>
  );
}

/** A single pyrotechnic flame jet. */
export function Flame({ x, y, h, delay }: { x: number; y: number; h: number; delay: number }) {
  return (
    <g transform={`translate(${x},${y})`}>
      <polygon points={`0,0 -7,0 0,${-h} 7,0`} fill={NEON.gold} opacity={0.9}>
        <animateTransform
          attributeName="transform"
          type="scale"
          values="1 0.15; 1 1; 1 0.4; 1 0.85; 1 0.15"
          dur="1.4s"
          begin={`${delay}s`}
          repeatCount="indefinite"
          additive="sum"
        />
        <animate
          attributeName="opacity"
          values="0.2;0.95;0.5;0.9;0.2"
          dur="1.4s"
          begin={`${delay}s`}
          repeatCount="indefinite"
        />
      </polygon>
      <polygon points={`0,0 -3.5,0 0,${-h * 0.6} 3.5,0`} fill="#fff3c4" opacity={0.95}>
        <animateTransform
          attributeName="transform"
          type="scale"
          values="1 0.1; 1 1; 1 0.3; 1 0.8; 1 0.1"
          dur="1.4s"
          begin={`${delay + 0.1}s`}
          repeatCount="indefinite"
          additive="sum"
        />
      </polygon>
    </g>
  );
}
