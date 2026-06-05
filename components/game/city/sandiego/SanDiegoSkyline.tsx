import { SD_GND } from './constants';
import { Palm } from './Palm';

const WIN = 'rgba(150,200,235,.18)'; // single window-tint overlay per building

const BUILDINGS = [
  { x: 1070, w: 58, h: 232, c: '#b4c0cc' },
  { x: 1136, w: 50, h: 286, c: '#bcc8d4' },
  { x: 1360, w: 64, h: 250, c: '#b0bcc8' },
  { x: 1432, w: 54, h: 300, c: '#b8c4d0' },
  { x: 1496, w: 60, h: 226, c: '#aab6c2' },
] as const;

/** Downtown San Diego skyline — One America Plaza sail-top + waterfront towers. */
export function SanDiegoSkyline() {
  return (
    <g>
      {BUILDINGS.map((b, i) => (
        <g key={i}>
          <rect x={b.x} y={SD_GND - b.h} width={b.w} height={b.h} fill={b.c} />
          {/* Shadow/highlight edges */}
          <rect x={b.x} y={SD_GND - b.h} width={9} height={b.h} fill="rgba(0,20,60,.2)" />
          <rect x={b.x + b.w - 7} y={SD_GND - b.h} width={7} height={b.h} fill="rgba(255,235,160,.14)" />
          {/* Single window-tint overlay — replaces hundreds of individual rects */}
          <rect x={b.x + 5} y={SD_GND - b.h + 8} width={b.w - 12} height={b.h - 16} fill={WIN} />
          <rect x={b.x - 2} y={SD_GND - b.h - 4} width={b.w + 4} height={5} fill="rgba(0,20,60,.26)" />
        </g>
      ))}

      {/* One America Plaza — sail-top tower */}
      <g>
        <rect x={1252} y={SD_GND - 360} width={60} height={360} fill="#d2dae2" />
        <rect x={1252} y={SD_GND - 360} width={10} height={360} fill="rgba(0,20,60,.18)" />
        <rect x={1305} y={SD_GND - 360} width={7}  height={360} fill="rgba(255,255,255,.1)" />
        {/* Window tint */}
        <rect x={1258} y={SD_GND - 352} width={46} height={344} fill={WIN} />
        <path
          d={`M1252,${SD_GND - 360} Q1312,${SD_GND - 398} 1312,${SD_GND - 360} Z`}
          fill="#dfe6ee"
        />
        <path
          d={`M1252,${SD_GND - 360} Q1312,${SD_GND - 398} 1312,${SD_GND - 360}`}
          fill="none"
          stroke="rgba(0,20,60,.18)"
          strokeWidth={1.5}
        />
        <rect x={1252} y={SD_GND - 364} width={60} height={5} fill="#c2ccd6" />
      </g>

      <Palm x={1040} h={118} lean={-6} />
      <Palm x={1200} h={96}  lean={5} />
      <Palm x={1540} h={126} lean={8} />
    </g>
  );
}
