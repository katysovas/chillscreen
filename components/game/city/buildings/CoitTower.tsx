// All geometry pre-computed at module load — no runtime math inside the render.
const CX        = 1370;
const BASE_Y    = 660;
const BODY_TOP  = 302;
const HALF_BASE = 56;
const HALF_TOP  = 7;
const SPIRE_TIP = 250;

const FACE  = '#d0d4de';
const SHADE = '#aeb4c4';
const WING  = '#c6cad6';
const WIN   = 'rgba(110,150,195,.30)';

/** y where a vertical line at horizontal distance d from centre exits the body */
function topYAt(d: number) {
  return BODY_TOP + (d - HALF_TOP) / (HALF_BASE - HALF_TOP) * (BASE_Y - BODY_TOP);
}

// 4 offsets × 2 sides = 8 mullion lines, expressed as a single path string.
const WIN_OFFSETS = [14, 24, 34, 44];
const MULLION_PATH = WIN_OFFSETS.flatMap(d => {
  const y = topYAt(d);
  return [
    `M${CX - d},${BASE_Y} L${CX - d},${y.toFixed(1)}`,
    `M${CX + d},${BASE_Y} L${CX + d},${y.toFixed(1)}`,
  ];
}).join(' ');

/**
 * Transamerica Pyramid — San Francisco's most recognizable tower.
 *
 * NOTE: the previous `CoitTower` export actually drew this pyramid silhouette.
 * Coit Tower is the separate cylindrical landmark on Telegraph Hill (drawn
 * elsewhere in the scene). This is renamed for clarity, with a `CoitTower`
 * alias kept at the bottom so existing imports keep working.
 */
export function TransamericaPyramid() {
  return (
    <g>
      {/* Two faces */}
      <polygon points={`${CX},${BASE_Y} ${CX - HALF_BASE},${BASE_Y} ${CX - HALF_TOP},${BODY_TOP} ${CX},${BODY_TOP}`} fill={SHADE} />
      <polygon points={`${CX},${BASE_Y} ${CX + HALF_BASE},${BASE_Y} ${CX + HALF_TOP},${BODY_TOP} ${CX},${BODY_TOP}`} fill={FACE} />
      <line x1={CX} y1={BASE_Y} x2={CX} y2={BODY_TOP} stroke="rgba(255,255,255,.25)" strokeWidth={1} />

      {/* Window mullions — single path instead of 8 separate line elements */}
      <path d={MULLION_PATH} stroke={WIN} strokeWidth={1.4} fill="none" />

      {/* Base setback band */}
      <rect x={CX - HALF_BASE - 2} y={BASE_Y - 20} width={(HALF_BASE + 2) * 2} height={5} fill={SHADE} opacity={0.45} />

      {/* East wing */}
      <polygon points="1341,460 1349,460 1349,346 1345,340 1341,346" fill={WING} />
      <rect x={1341} y={346} width={2} height={114} fill="#dde0e8" opacity={0.6} />
      {/* West wing */}
      <polygon points="1391,460 1399,460 1399,326 1395,320 1391,326" fill={WING} />
      <rect x={1397} y={326} width={2} height={134} fill="rgba(0,20,60,.18)" />

      {/* Spire */}
      <polygon points={`${CX - HALF_TOP},${BODY_TOP} ${CX + HALF_TOP},${BODY_TOP} ${CX},${SPIRE_TIP}`} fill="#c8ccd6" />
      <line x1={CX} y1={BODY_TOP} x2={CX} y2={SPIRE_TIP} stroke="rgba(0,20,60,.15)" strokeWidth={1} />

      {/* Mast + aircraft warning light */}
      <rect x={CX - 1.5} y={SPIRE_TIP - 18} width={3} height={18} fill="#9aa0ad" />
      <circle cx={CX} cy={SPIRE_TIP - 20} r={2.4} fill="#e8503c" />
      <circle cx={CX} cy={SPIRE_TIP - 20} r={4.5} fill="rgba(232,80,60,.3)" />
    </g>
  );
}

/** Back-compat alias — this silhouette is the Transamerica Pyramid. */
export const CoitTower = TransamericaPyramid;
