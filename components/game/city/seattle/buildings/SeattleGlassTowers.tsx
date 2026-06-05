import { SEATTLE_GND } from '../constants';

const WIN = 'rgba(150,200,235,.18)'; // single window-tint overlay per building

const TOWERS = [
  { x: 1180, w: 64, h: 250, c: '#aeb8c4' },
  { x: 1432, w: 70, h: 286, c: '#b6c0cc' },
  { x: 1512, w: 56, h: 232, c: '#a8b2be' },
  { x: 1600, w: 76, h: 300, c: '#b2bcc8' },
  { x: 1692, w: 60, h: 246, c: '#aab4c0' },
] as const;

export function SeattleGlassTowers() {
  const GND = SEATTLE_GND;

  return (
    <>
      {TOWERS.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={GND - b.h} width={b.w} height={b.h} fill={b.c} />
          <rect x={b.x}           y={GND - b.h} width={10}    height={b.h} fill="rgba(0,20,60,.2)" />
          <rect x={b.x + b.w - 8} y={GND - b.h} width={8}     height={b.h} fill="rgba(255,230,150,.12)" />
          {/* Single window-tint overlay — replaces hundreds of individual rects */}
          <rect x={b.x + 6} y={GND - b.h + 8} width={b.w - 16} height={b.h - 16} fill={WIN} />
          <rect x={b.x - 2} y={GND - b.h - 4} width={b.w + 4} height={5} fill="rgba(0,20,60,.28)" />
        </g>
      ))}
    </>
  );
}
